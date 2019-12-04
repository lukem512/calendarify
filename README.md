# calendarify

A client-side calendar library designed to work as a drop-in replacement for `<input type="date">`, which I dislike.

## What does it look like?

![calendarify in action](https://i.imgur.com/nn28Cz0.png)

## Usage

Simply include the JavaScript and CSS files, then instantiate the calendarified datepickers by calling `calendarify('#input-selector', opts)`. Oh, and you'll need [moment](https://momentjs.com/) too.

```html
<html>
  <head>
    <!-- You'll need this for the arrow characters -->
    <meta charset="UTF-8">
    
    <!-- Calendarify uses moment for date manipulation -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js"></script>
    
    <!-- Then include the styles and the script! -->
    <link href="calendarify.css" rel="stylesheet">
    <script src="calendarify.js"></script>
  </head>
  <body>
    <!-- Create an input -->
    <input id="input-selector" placeholder="Pick a date!"></input>
    
    <!-- Call the instantiation -->
    <script>
      calendarify('#input-selector');
    </script>
  </body>
</html>
```

You can specify `tags` to colour specific dates by including them in the `opts` parameter. The tags will be displayed as coloured pips to the right of the date on the popout calendar. A legend, using the `label` field of the tag, is also displayed at the bottom.

A default `date` can be provided, either as the `value` of the `input` element or via the `date` field in the `opts`; the latter, via the `opts` object, takes priority.

```js
  let opts = {
    date: '13/12/2019',
    tags: [ { dates: ['25/12/2019', '26/12/2019'], label: 'Christmas!', color: 'red' } ]
  }
```

See the [examples/](examples) directory for more information.

## License

MIT
