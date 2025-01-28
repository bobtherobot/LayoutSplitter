# LayoutSplitter

A layout splitter for web apps that need resizable panels.

DIVs can have the following data-atts:


Settings are comma-delimited in the data-layout attribute as:

    <div data-layout = "row, size=100, remember"></div>

Available settings:
- __layout__ (required) (string) - "row" "col"
- __size__ (optional) (number | string for percent) - assume pixel when number. Use "100%" for percent vals, and "100", or "100px" for pixel values.
- __min__ (optional) (number | string for percent) Use "100%" for percent vals, and "100", or "100px" for pixel values.
- __fixed__ (optional) - attaches panel to current position (e.g. a fixed-size righ-hand panel)
- __remember__ (optional) - remembers panels open/closed/position when page is reloaded
- __noresize__ (optional) - prevents resizing when exists
- __noscroll__ (optional) - prevents scrolling when exists
- __onresize__ (optional) (string) - function identifier as a string (e.g. onresize=myFunc will call window.myFunc when resizing.)
- __onresizecomplete__ (optional) (string) - funciton identifier as a string (e.g. onresizecomplete=myFunc)

### Example

    <div data-layout="col, onresize=myFunc, remember">

        <!-- top can't be resized -->
        <div data-layout="row, size=100, noresize">frank</div>

        <!-- center no size, will auto-determine the size -->
        <div data-layout="row">bob</div> 

        <!-- bottom fixed and attached to the bottom -->
        <div data-layout="row, size=100, fixed, min=50px">sally</div>

    </div>

Notes:
- There should be one "root" element, which can be either a "row" or "col".
- Rows and cols should alternate. Can't really have a row in a row?
- The parent of the root (e.g. or wrapping) must have a width and height (style or css).
- Only div's with an ID attribute will be automatically restored.

# Docs
See dist/example.html for, um, example setup.
See "docs" folder for all documentation.

# Change Log

### 2025-01-27 @ 20:09:23
- moved "remember" to use a single json key
- set localstorage key to the URL -- so other layoutSplitters don't interfere with eachother.
- swapped parseFloat to custom toNumber
- set example.html to use remember
- fixed readme documentation