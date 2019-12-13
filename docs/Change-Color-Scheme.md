## Change Color Scheme
Our custom color scheme setup now includes a total of 6 colors defined within the `./src/scss/variables/_colors.scss` file. Though it isn't necessary to use all the available variables, these variables include:
- Light Accent ($light-accent)
- Light Shade ($light-shade)
- Main Accent ($main-accent)
- Main Shade ($main-shade)
- Dark Accent ($dark-accent)
- Dark Shade ($dark-shade)

Changing these will result in color changes across the site as the default theme uses them in many places. All colors are setup to autogenerate button classes and background color classes. You need only to reference these within the HTML element to use them: `<a href="#" class="btn btn-main-accent">Click Me</a>`.

### Bootstrap 4 Colors
If you find you would prefer to stick to Bootstrap 4's color options, you may now do so within the `./src/scss/variables/_bs-overrides.scss` file. We have currently added in these variables:
- Primary ($primary)
- Secondary ($secondary)
- Success ($success)
- Info ($info)
- Warning ($warning)
- Danger ($danger)
- Light ($light)
- Dark ($dark)

If you want to change the theme to use Bootstrap colors, you will need to replace nvQuickTheme's variables with Bootstrap's. Bootstrap's button classes and background color classes are still default out-of-the-box and can be referenced like usual: `<a href="#" class="btn btn-primary">Click Me</a>`.

### Color Scheme (pre-2.2.0)
[![nvQuickTheme Video Series - Color Scheme](https://img.youtube.com/vi/o1XW3e8JKfw/0.jpg)](https://www.youtube.com/watch?v=o1XW3e8JKfw)

## Change Color Scheme (pre-2.2.0)
Most websites are going to key off the colors for the brand being represented.  Following industry best practices, there are typically three colors selected for the website main colors: primary, secondary and tertiary. These are defined within the `./src/scss/variables/_colors.scss` file. Updating these SCSS variable color definitions using HEX or RGB colors will change usage of these throughout the theme.  

There are also colors defined for variants of gray, normal font colors, borders and links. These are all easily modified within this one file.

Additionally, base Bootstrap classes can be used for various colors within your custom theme.