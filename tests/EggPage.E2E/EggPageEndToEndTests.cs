namespace EggPage.E2E;

using System.Net;
using AngleSharp;
using AngleSharp.Dom;
using AngleSharp.Html.Dom;
using AngleSharp.Css;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.VisualStudio.TestTools.UnitTesting;

[TestClass]
public class EggPageEndToEndTests
{
    private const string EggEmoji = "🥚";

    [TestMethod(DisplayName = "axm-3d1f2a74 egg page shows the egg emoji and the word Eggs to a visitor")]
    public async Task EggPage_ShowsEggEmojiAndEggsWord_ToVisitor()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/");
        var html = await response.Content.ReadAsStringAsync();

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);

        var document = Parse(html);
        var body = document.Body;

        var emojiElements = body.QueryAll("*")
            .Where(e => e.TextContent.Contains(EggEmoji))
            .ToList();
        Assert.IsTrue(emojiElements.Count > 0, "The egg emoji is not visible on the page.");

        var eggsElements = body.QueryAll("*")
            .Where(e => e.TextContent.Trim() == "Eggs")
            .ToList();
        Assert.IsTrue(eggsElements.Count > 0, "The word 'Eggs' is not visible on the page.");
    }

    [TestMethod(DisplayName = "axm-5a3be050 the word Eggs appears below the emoji in sans-serif text")]
    public async Task EggsText_AppearsBelowEmoji_InSansSerif()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/");
        var html = await response.Content.ReadAsStringAsync();

        var document = Parse(html);
        var body = document.Body;

        var emojiElement = body.QueryAll("*")
            .Where(e => e.TextContent.Contains(EggEmoji))
            .LastOrDefault();
        Assert.IsNotNull(emojiElement, "The egg emoji is not on the page.");

        var eggsElement = body.QueryAll("*")
            .Where(e => e.TextContent.Trim() == "Eggs")
            .LastOrDefault();
        Assert.IsNotNull(eggsElement, "The word 'Eggs' is not on the page.");

        var emojiRect = emojiElement.GetBoundingClientRect();
        var eggsRect = eggsElement.GetBoundingClientRect();
        Assert.IsTrue(
            eggsRect.Top >= emojiRect.Bottom,
            $"The word 'Eggs' (top {eggsRect.Top}) is not below the emoji (bottom {emojiRect.Bottom}).");

        var style = document.GetStyleFor(eggsElement);
        var fontFamily = style.FontFamily;
        Assert.IsTrue(
            fontFamily.Contains("sans-serif"),
            $"The word 'Eggs' font-family '{fontFamily}' is not sans-serif.");
    }

    [TestMethod(DisplayName = "axm-9d20c3c4 a single egg emoji appears centered on the page")]
    public async Task SingleEggEmoji_AppearsCentered_OnPage()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/");
        var html = await response.Content.ReadAsStringAsync();

        var document = Parse(html);
        var body = document.Body;

        var emojiCount = body.TextContent.Count(c => c == EggEmoji);
        Assert.AreEqual(1, emojiCount, "Expected exactly one egg emoji on the page.");

        var emojiElement = body.QueryAll("*")
            .Where(e => e.TextContent.Contains(EggEmoji))
            .LastOrDefault();
        Assert.IsNotNull(emojiElement, "The egg emoji is not on the page.");

        var rect = emojiElement.GetBoundingClientRect();
        var centerX = rect.Left + rect.Width / 2;
        var centerY = rect.Top + rect.Height / 2;

        Assert.AreEqual(400, centerX, 2, "The egg emoji is not horizontally centered.");
        Assert.AreEqual(300, centerY, 2, "The egg emoji is not vertically centered.");
    }

    [TestMethod(DisplayName = "axm-d0e240ad tests select elements by visible output, not internal classes or ids")]
    public async Task Elements_AreSelectedByVisibleOutput_NotInternalClassesOrIds()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/");
        var html = await response.Content.ReadAsStringAsync();

        var document = Parse(html);
        var body = document.Body;

        // This test selects the egg emoji and the 'Eggs' label purely by their visible
        // text content — never by an internal class or id — so it keeps passing even if
        // the page's internal class or id names change without a change to what is shown.
        var emojiElement = body.QueryAll("*")
            .Where(e => e.TextContent.Contains(EggEmoji))
            .LastOrDefault();
        Assert.IsNotNull(emojiElement, "The egg emoji is not visible on the page.");

        var eggsElement = body.QueryAll("*")
            .Where(e => e.TextContent.Trim() == "Eggs")
            .LastOrDefault();
        Assert.IsNotNull(eggsElement, "The word 'Eggs' is not visible on the page.");

        // The visible output found by text content is the same output a visitor sees:
        // the emoji is above the 'Eggs' label.
        var emojiRect = emojiElement.GetBoundingClientRect();
        var eggsRect = eggsElement.GetBoundingClientRect();
        Assert.IsTrue(
            eggsRect.Top >= emojiRect.Bottom,
            "The word 'Eggs' is not below the egg emoji.");
    }

    private static IDocument Parse(string html)
    {
        var context = BrowsingContext.New(Configuration.Default);
        var document = context.OpenAsync(req => req.Content(html)).GetAwaiter().GetResult();
        document.StyleSheets.LoadAsync().GetAwaiter().GetResult();
        return document;
    }
}
