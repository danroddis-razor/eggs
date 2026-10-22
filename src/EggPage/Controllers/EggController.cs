namespace EggPage.Controllers;

using Microsoft.AspNetCore.Mvc;

public class EggController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}
