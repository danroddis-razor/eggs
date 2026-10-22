namespace EggPage.E2E;

using System.Net;
using AngleSharp;
using AngleSharp.Css;
using AngleSharp.Dom;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.VisualStudio.TestTools.UnitTesting;

[TestClass]
public class EggPageEndToEndTests
{
    private const string EggEmoji = "\U0001F95A";

    [TestMethod(DisplayName = "axm-361279f3 the egg page serves the egg emoji and the word Eggs to a visitor")]
    public async Task EggPage_ServesEggEmojiAndEggsWord_ToVisitor()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/");
        var html = await response.Content.ReadAsStringAsync();

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);

        var document = Parse(html);
        var body = document.Body;

        var emojiElement = FindByVisibleText(body, e => e.TextContent.Contains(EggEmoji));
        Assert.IsNotNull(emojiElement, "The egg emoji is not visible on the page.");

        var eggsElement = FindByVisibleText(body, e => e.TextContent.Trim() == "Eggs");
        Assert.IsNotNull(eggsElement, "The word 'Eggs' is not visible on the page.");
    }

    [TestMethod(DisplayName = "axm-53ccc0d3 a single egg emoji appears centered on the page")]
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

        var emojiElement = FindByVisibleText(body, e => e.TextContent.Contains(EggEmoji));
        Assert.IsNotNull(emojiElement, "The egg emoji is not on the page.");

        var bodyStyle = document.GetStyleFor(body);
        Assert.AreEqual("flex", bodyStyle.Display, "The page body is not laid out with flexbox.");
        Assert.AreEqual("center", bodyStyle.AlignItems, "The page body does not center its content vertically.");
        Assert.AreEqual("center", bodyStyle.JustifyContent, "The page body does not center its content horizontally.");
    }

    [TestMethod(DisplayName = "axm-75aea16b the word Eggs appears below the emoji in sans-serif text")]
    public async Task EggsText_AppearsBelowEmoji_InSansSerif()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/");
        var html = await response.Content.ReadAsStringAsync();

        var document = Parse(html);
        var body = document.Body;

        var emojiElement = FindByVisibleText(body, e => e.TextContent.Contains(EggEmoji));
        Assert.IsNotNull(emojiElement, "The egg emoji is not on the page.");

        var eggsElement = FindByVisibleText(body, e => e.TextContent.Trim() == "Eggs");
        Assert.IsNotNull(eggsElement, "The word 'Eggs' is not on the page.");

        var comparison = System.Xml.XmlDocument.CompareDocumentPosition(emojiElement, eggsElement);
        Assert.IsTrue(
            comparison.HasFlag(System.Xml.XmlDocumentPosition.Following)
            || comparison.HasFlag(System.Xml.XmlDocumentPosition.DescendantFollowing),
            "The word 'Eggs' does not appear below the egg emoji.");

        var style = document.GetStyleFor(eggsElement);
        var fontFamily = style.FontFamily;
        Assert.IsTrue(
            fontFamily.Contains("sans-serif"),
            $"The word 'Eggs' font-family '{fontFamily}' is not sans-serif.");
    }

    [TestMethod(DisplayName = "axm-9ddf1d7f the egg page takes no inputs and its only outputs are the egg emoji and the word Eggs")]
    public async Task EggPage_TakesNoInputs_AndOnlyOutputsEggEmojiAndEggsWord()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/");
        var html = await response.Content.ReadAsStringAsync();

        var document = Parse(html);
        var body = document.Body;

        Assert.AreEqual(0, body.QuerySelectorAll("input").Count, "The egg page must not take inputs.");
        Assert.AreEqual(0, body.QuerySelectorAll("form").Count, "The egg page must not take inputs.");
        Assert.AreEqual(0, body.QuerySelectorAll("button").Count, "The egg page must not take inputs.");
        Assert.AreEqual(0, body.QuerySelectorAll("script").Count, "The egg page must not mutate state.");

        var emojiElement = FindByVisibleText(body, e => e.TextContent.Contains(EggEmoji));
        Assert.IsNotNull(emojiElement, "The egg emoji is not visible on the page.");

        var eggsElement = FindByVisibleText(body, e => e.TextContent.Trim() == "Eggs");
        Assert.IsNotNull(eggsElement, "The word 'Eggs' is not visible on the page.");

        var visibleText = body.TextContent.Trim();
        Assert.AreEqual(EggEmoji + "Eggs", visibleText, "The page's only visible outputs must be the egg emoji and the word 'Eggs'.");
    }

    [TestMethod(DisplayName = "axm-c6a66772 tests select elements by visible output, not internal classes or ids")]
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
        var emojiElement = FindByVisibleText(body, e => e.TextContent.Contains(EggEmoji));
        Assert.IsNotNull(emojiElement, "The egg emoji is not visible on the page.");

        var eggsElement = FindByVisibleText(body, e => e.TextContent.Trim() == "Eggs");
        Assert.IsNotNull(eggsElement, "The word 'Eggs' is not visible on the page.");

        var comparison = System.Xml.XmlDocument.CompareDocumentPosition(emojiElement, eggsElement);
        Assert.IsTrue(
            comparison.HasFlag(System.Xml.XmlDocumentPosition.Following)
            || comparison.HasFlag(System.Xml.XmlDocumentPosition.DescendantFollowing),
            "The word 'Eggs' is not below the egg emoji.");
    }

    private static IElement? FindByVisibleText(IElement root, Func<IElement, bool> predicate)
    {
        var matches = root.QueryAll("*").Where(predicate).ToList();
        return matches.Count == 0 ? null : matches[^1];
    }

    private static IDocument Parse(string html)
    {
        var context = BrowsingContext.New(Configuration.Default);
        var document = context.OpenAsync(req => req.Content(html)).GetAwaiter().GetResult();
        document.StyleSheets.LoadAsync().GetAwaiter().GetResult();
        return document;
    }
}
