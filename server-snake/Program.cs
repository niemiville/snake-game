using System;
using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

public class Startup
{
    private static ConcurrentDictionary<WebSocket, Player> players = new ConcurrentDictionary<WebSocket, Player>();

    public void ConfigureServices(IServiceCollection services)
    {
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        app.UseWebSockets();

        app.Use(async (context, next) =>
        {
            if (context.Request.Path == "/ws")
            {
                if (context.WebSockets.IsWebSocketRequest)
                {
                    WebSocket webSocket = await context.WebSockets.AcceptWebSocketAsync();
                    await HandleWebSocketAsync(webSocket);
                }
                else
                {
                    context.Response.StatusCode = 400;
                }
            }
            else
            {
                await next();
            }
        });
    }

    private async Task HandleWebSocketAsync(WebSocket webSocket)
    {
        // Add player to the dictionary
        var player = new Player();
        players.TryAdd(webSocket, player);

        var buffer = new byte[1024 * 4];
        WebSocketReceiveResult result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

        while (!result.CloseStatus.HasValue)
        {
            string message = Encoding.UTF8.GetString(buffer, 0, result.Count);

            var updatedPosition = System.Text.Json.JsonSerializer.Deserialize<SnakePosition>(message);

            // Update player's snake position
            player.SnakePosition = updatedPosition;

            // Broadcast updated game state to all clients
            foreach (var ws in players.Keys)
            {
                if (ws.State == WebSocketState.Open)
                {
                    var gameState = new GameState(players.Values);
                    var gameStateJson = System.Text.Json.JsonSerializer.Serialize(gameState);
                    Console.WriteLine(gameStateJson);
                    await ws.SendAsync(new ArraySegment<byte>(Encoding.UTF8.GetBytes(gameStateJson)), result.MessageType, result.EndOfMessage, CancellationToken.None);
                }
            }

            result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
        }

        // Remove player when disconnected
        players.TryRemove(webSocket, out _);
        await webSocket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, CancellationToken.None);
    }
}

public class Player
{
    public SnakePosition SnakePosition { get; set; } = new SnakePosition();
}

public class SnakePosition
{
    public List<Position> Body { get; set; }
}

public class Position
{
    public int x { get; set; }
    public int y { get; set; }
}


public class GameState
{
    public SnakePosition[] Players { get; set; }

    public GameState(ICollection<Player> players)
    {
        Players = new SnakePosition[players.Count];
        int i = 0;
        foreach (var player in players)
        {
            Players[i++] = player.SnakePosition;
        }
    }
}

public class Program
{
    public static void Main(string[] args)
    {
        CreateHostBuilder(args).Build().Run();
    }

    public static IHostBuilder CreateHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            .ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.UseStartup<Startup>();
            });
}
