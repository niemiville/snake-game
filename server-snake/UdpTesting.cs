/*using System.Collections.Concurrent;
using System.Net.Sockets;
using System.Net;
using System.Text;

public class Startup
{
    private static ConcurrentDictionary<IPEndPoint, Player> players = new ConcurrentDictionary<IPEndPoint, Player>();

    public void ConfigureServices(IServiceCollection services)
    {
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        app.Use(async (context, next) =>
        {
            if (context.Request.Path == "/udp")
            {
                var udpClient = new UdpClient();
                udpClient.Client.Bind(new IPEndPoint(IPAddress.Any, 1234));

                while (true)
                {
                    var receivedResult = await udpClient.ReceiveAsync();
                    var message = Encoding.UTF8.GetString(receivedResult.Buffer);

                    var updatedPosition = System.Text.Json.JsonSerializer.Deserialize<SnakePosition>(message);

                    var player = new Player();
                    players.TryAdd(receivedResult.RemoteEndPoint, player);

                    player.SnakePosition = updatedPosition;

                    foreach (var endpoint in players.Keys)
                    {
                        var gameState = new GameState(players.Values);
                        var gameStateJson = System.Text.Json.JsonSerializer.Serialize(gameState);
                        var buffer = Encoding.UTF8.GetBytes(gameStateJson);
                        await udpClient.SendAsync(buffer, buffer.Length, endpoint);
                    }
                }
            }
            else
            {
                await next();
            }
        });
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
*/