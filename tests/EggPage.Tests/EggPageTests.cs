namespace EggPage.Tests;

using System.Net.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

public class EggPageTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> factory;

    public EggPageTests(WebApplicationFactory<Program> factory)
    {
        this.factory = factory;
    }

    [Fact]
    public async Task Single egg emoji appears centered axm-82d42af2()
    {
        var client = this.factory.CreateClient();
        var page = await client.GetStringAsync("/");
        var css = await client.GetStringAsync("/css/site.css");

        Assert.Equal(1, CountOccurrences(page, "🥚"));
        Assert.Contains("align-items: center", css);
    }

    [Fact]
    public async Task Eggs text appears below emoji in sans-serif axm-ee531ec9()
    {
        var client = this.factory.CreateClient();
        var page = await client.GetStringAsync("/");
        var css = await client.GetStringAsync("/css/site.css");

        var emojiIndex = page.IndexOf("🥚", StringComparison.Ordinal);
        var labelIndex = page.IndexOf("Eggs", emojiIndex, StringComparison.Ordinal);
        Assert.True(labelIndex > emojiIndex, "The word 'Eggs' must appear below the egg emoji.");
        Assert.Contains("font-family: sans-serif", css);
    }

    [Fact]
    public async Task Todays date appears below the word Eggs axm-0426c0f9()
    {
        var client = this.factory.CreateClient();
        var page = await client.GetStringAsync("/");

        var emojiIndex = page.IndexOf("🥚", StringComparison.Ordinal);
        var labelIndex = page.IndexOf("Eggs", emojiIndex, StringComparison.Ordinal);
        var today = DateTime.Today.ToString("d");
        var dateIndex = page.IndexOf(today, labelIndex, StringComparison.Ordinal);
        Assert.True(dateIndex > labelIndex, $"Today's date '{today}' must appear below the word 'Eggs'.");
    }

    private static int CountOccurrences(string text, string value)
    {
        var count = 0;
        var index = 0;
        while ((index = text.IndexOf(value, index, StringComparison.Ordinal)) >= 0)
        {
            count++;
            index += value.Length;
        }

        return count;
    }
}
