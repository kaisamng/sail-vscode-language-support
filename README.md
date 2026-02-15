# Visual Studio Code Language Support for Appian Expressions
An extension for Visual Studio Code that provides formatting and syntax highlighting for code constructed inside an Appian Expression Editor.

The typical Appian Developer has 50 browser tabs and 5 browser windows open. Sometimes you just want to paste mock data or debug data inside of a scratchpad. This extension handles formatting that data as well as syntax highlighting for easy readability.

| Light Mode | Dark Mode |
| :---: | :---: |
| ![Light Theme](images/light-theme.png) | ![Dark Theme](images/dark-theme.png) |

## Features
- Formats arrays, functions, etc.
- Dark Mode and Light Mode
- Syntax Highlighting for functions, expression rules, local variables, and more
- Pillbox highlights around literal Appian Object references like Record Types (record types and site objects for now, more planned for future). UUIDs are still available but de-emphasized, and indexed fields/relationships/site pages/etc. are bolded for easy developer reference. 
![Pillbox Example](images/pillbox-example.png)

## Known Issues
- Inside a pillbox, there is a faint dividing line between icons and code. This is due to a limitation with VS Code's text decoration API that only allows for a limited subset of CSS properties. 
- You must manually select the programming language as SAIL. Formatting doesn't automatically apply until you start typing something in the code editor. 
- Syntax highlighting for variables indexed through dot notation don't carry over. This will be fixed in a future release
- Semantic Highlighting sometimes fails in dark mode, or doesn't play nicely with whatever theme currently set in VS Code. This is because token highlighting is done with TextMate, and either the theme is overriding token colors, or semantic highlighting is overriding token colors. To fix, either set your theme to the provided "Sail Expression Editor-Light" theme or the "Sail Expression Editor- Dark" themes. You can also try to insert the provided tokenColors map into own settings.json. 
- The formatter assumes that your code is valid. If you have one missing comma, the formatter will fail to carriage return and may go haywire. This plugin will not validate your code for you. 

## To Do
- Add formatting logic to pillbox other literal object references like Portals, Translation Strings, etc.
- Make the pillbox prettier, margins are kinda ugly right now
- Refactor extension.js code (to accomodate all you crazy devs that go 4 record relationships deep)