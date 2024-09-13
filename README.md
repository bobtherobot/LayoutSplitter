# LayoutSplitter

A layout splitter for web apps that need resizable panels.

DIVs can have the following data-atts:
- data-layout (required) (string) - "row" "col"
- data-size (optional) (number | string for percent) - assume pixel when number, use "!00%" for percent vals
- data-min (optional) (number | string for percent)
- data-fixed (optional) - attaches panel to current position (e.g. a fixed-size righ-hand panel)
- data-remember (optional) - remembers panels open/closed/position when page is reloaded
- data-noresize (optional) - prevents resizing when exists
- data-noscroll (optional) - prevents scrolling when exists
- data-onresize (optional) (string) - funciton identifier as a string (e.g. "myFunc")
- data-onresizecomplete (optional) (string) - funciton identifier as a string (e.g. "myFunc")


### Example

    <div data-layout="col">
        <div data-layout="row" data-size=100>frank</div>

        <!-- no size, layout will auto-determine the size -->
        <div data-layout="row">bob</div> 

        <!-- "fixed" = attached to bottom -->
        <div data-layout="row" data-size=100 data-fixed>sally</div>
    </div>

Notes:
- There should be one "root" element, which can be either a "row" or "col".
- The parent of the root (e.g. or wrapping) must have a width and height (style or css).
- Only div's with an ID attribute will be automatically restored.

# Docs
See dist/example.html for, um, example setup.
See "docs" folder for all documentation.

