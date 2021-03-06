// Calendarify
// Client-side calendar library designed to replace the
// <input type="date"> tag, which is lacking.
// Luke Mitchell, Dec. 2019

// Constants, for ease of use
const CALENDARIFY_DAYS = 7
const CALENDARIFY_MONTHS = 12
const CALENDARIFY_ROWS = 6
const CALENDARIFY_MONTH_ROWS = 4
const CALENDARIFY_MONTHS_PER_ROW = CALENDARIFY_MONTHS / CALENDARIFY_MONTH_ROWS

const CALENDARIFY_TAG_DATE_FORMAT = 'DD/MM/YYYY'

// Event handler to open calendar popout
function handleOpenCalendarClick(e) {
  let calendarInfo = findCalendarInfoFromElem(e.target)
  let calendarEl = document.getElementById(calendarInfo.calendarId)
  let inputEl = document.getElementById(calendarInfo.inputId)

  // Get the input container
  let rect = inputEl.parentNode.getBoundingClientRect()

  // Find a positioned ancestor
  let positionedEl = getPositionedAncestor(inputEl)
  let boundingRect = positionedEl ? positionedEl.getBoundingClientRect() : new rect(0, 0, 0, 0)

  // TODO: add some logic to prevent the calendar appearing off-screen
  // i.e. move to bottom, top, left, right

  // Placement: right
  calendarEl.style.left = (rect.left - boundingRect.left) + rect.width + 10 + 'px'
  calendarEl.style.top = (rect.top - boundingRect.top) + 'px'
  calendarEl.style.marginBottom = '1rem'
  calendarEl.style.marginRight = '1rem'

  // Show the calendar!
  calendarEl.classList.remove('calendarify-display-none')
}

// Event handler to validate a date manually
// entered into the input
function handleInputChange(e) {
  let { value, id: inputId } = e.target

  // Check for a valid date
  let newDate = moment(value, getDateFormat())
  e.target.classList.toggle('invalid', !newDate.isValid())

  if (newDate.isValid()) {
    let calendarId = makeCalendarId(inputId)
    let calendarInfo = document.calendarify.calendars[calendarId]

    // Add the new date to the calendar object
    calendarInfo.date = newDate

    // Clone it for the selectedDate
    // This avoids it being mutated when the calendar changes
    calendarInfo.selectedDate = moment(newDate)

    // Update the calendar with the new value
    updateCalendar(calendarId)
  }
}

// Event handler to populate the input with the date
// of the clicked day
function handleCalendarDayClick(e) {
  let calendarInfo = findCalendarInfoFromElem(e.target)
  let { inputId, calendarId } = calendarInfo
  let inputEl = document.getElementById(inputId)
  let calendarEl = document.getElementById(calendarId)

  // Was the target a day or a tag?
  let targetEl = e.target.classList.contains('tag') ? e.target.parentNode : e.target

  // Instantiate moment with the new date
  // Specify the exact format for localisation
  let newDate = moment(targetEl.getAttribute('data-date'), getDateFormat())

  // Add the new value to the input element
  inputEl.value = newDate.format(getDateFormat())

  // Hide the calendar
  calendarEl.classList.add('calendarify-display-none')

  // And fire the onChange event for the input!
  inputEl.dispatchEvent(new Event('change', { 'bubbles': true }))
}

// Event handler to open month selector
function handleToggleMonthSelecionClick(e) {
  let calendarInfo = findCalendarInfoFromElem(e.target)
  toggleView(calendarInfo.inputId)
}

function handleCalendarMonthClick(e) {  
  // Set the month to the one clicked
  let calendarInfo = findCalendarInfoFromElem(e.target)
  calendarInfo.date.month(e.target.innerHTML)
  
  // Update the calendar
  updateCalendar(calendarInfo.calendarId)
  
  // Resume usual selection
  switchToDayView(calendarInfo.inputId)
}

// Event handler to change calendar to the
// previous month
function handlePrevMonthClick(e) {
  let calendarInfo = findCalendarInfoFromElem(e.target)
  let { calendarId } = calendarInfo
  calendarInfo.date.subtract(1, 'months')
  updateCalendar(calendarId)
}

// Event handler to change calendar to the
// next month
function handleNextMonthClick(e) {
  let calendarInfo = findCalendarInfoFromElem(e.target)
  let { calendarId } = calendarInfo
  calendarInfo.date.add(1, 'months')
  updateCalendar(calendarId)
}

// Event handler to change calendar date
// to today (current date)
function handleTodayClick(e) {
  let calendarInfo = findCalendarInfoFromElem(e.target)
  let { inputId, calendarId } = calendarInfo
  let calendarEl = document.getElementById(calendarId)
  let inputEl = document.getElementById(inputId)

  // Create the date objects for today's date
  calendarInfo.date = moment()
  calendarInfo.selectedDate = moment()

  // Update the input element
  inputEl.value = moment().format(getDateFormat())
  inputEl.classList.remove('invalid')
  
  // Resume usual selection
  switchToDayView(inputId)

  // Hide and update the calendar
  calendarEl.classList.add('calendarify-display-none')
  updateCalendar(calendarId)
}

// Steps up the DOM from a given element
// and returns the parent calendar
function findCalendarInfoFromElem(el) {
  if (!el || el.nodeName.toUpperCase() == 'HTML') {
    console.log('Could not find calendar')
    return null
  }
  if (el.classList.contains('calendarify-popout')) {
    return document.calendarify.calendars[el.id]
  }
  if (el.classList.contains('calendarify-input-group')) {
    let inputId = el.childNodes[0].id
    return document.calendarify.calendars[makeCalendarId(inputId)]
  }
  return findCalendarInfoFromElem(el.parentNode)
}

// Removes any classes attached to a calendar day
function resetDay(elem) {
  elem.classList.remove('last-month')
  elem.classList.remove('next-month')
  elem.classList.remove('weekend')
  elem.classList.remove('today')
  elem.classList.remove('selected')
}

// Populates a calendar day with the date and any tags
function populateDay(elem, date, selectedDate, tagsToAdd = [], classesToAdd = []) {
  resetDay(elem)
  elem.innerHTML = date.date()

  // Add the 'today' class, if appropriate
  if (date.isSame(moment(), 'day')) {
    elem.classList.add('today')
  }

  // Add the 'selected' class, if appropriate
  if (date.isSame(selectedDate, 'day')) {
    elem.classList.add('selected')
  }

  // Add the 'weekend' class, if appropriate
  if (date.isoWeekday() > 5) {
    elem.classList.add('weekend')
  }

  // Add tags to the day
  tagsToAdd.forEach(tag => addTagToDay(elem, tag.color))

  // Check whether any tags prevent selecting the date
  let disabled = tagsToAdd.some(tag => tag.selectable === false)

  // Add an event listener
  if (!disabled) {
    elem.setAttribute('data-date', date.format(getDateFormat()))
    elem.addEventListener('click', handleCalendarDayClick)
  }

  // Add the additional classes
  classesToAdd.forEach(cl => elem.classList.add(cl))
}

function addTagToDay(elem, color) {
  let tagElem = document.createElement('div')
  tagElem.classList.add('tag')
  tagElem.style.backgroundColor = color
  elem.appendChild(tagElem)
}

// Returns a trivial UID: a unix timestamp in ms
function getRandomUID() {
  return moment().valueOf()
}

// Returns a locale-specific date format string
function getDateFormat() {
  return moment.localeData().longDateFormat('L')
}

// Determines the default date to use for the
// calendar. The options takes first priority,
// then the element's value, then today's date
function makeDefaultDate(el, opts) {
  let { date: fromOpts } = opts
  if (fromOpts && moment(fromOpts, getDateFormat()).isValid()) {
    return moment(fromOpts, getDateFormat())
  }

  let { value: fromEl} = el
  if (fromEl && moment(fromEl, getDateFormat()).isValid()) {
    return moment(fromEl, getDateFormat())
  }

  return moment()
}

// Construct the ID for the calendar element
function makeCalendarId(inputId) {
  return `${inputId}-calendarify-popout`
}

// Construct the ID for the legend element
function makeLegendId(inputId) {
  return `${inputId}-legend`
}

// Construct the ID for the days container element
// This is shown during normal (day) calendar operation
function makeDaysContainerId(inputId) {
  return `${inputId}-days-selection`
}

// Construct the ID for the months container element
// This is shown during month selection
function makeMonthsContainerId(inputId) {
  return `${inputId}-months-selection`
}

// Construct an SVG string,
// with optional rotation (in degrees)
function makeArrowIcon(rotation) {
  let transform
  if (rotation) {
    transform = `transform="rotate(${rotation}, 350, 350)"`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700" version="1.0">
    <path ${transform} d="M700 .713C700 2.57 350.008 700.7 349.428 699.999 347.482 697.645-.64.54 0 .28.419.111 79.298 33.971 175.287 75.524l174.526 75.55 174.242-75.537C619.888 33.992 698.68 0 699.15 0c.468 0 .851.32.851.713z" />
  </svg>`
}

// Transform tags into a list of tags per date
function makeTagsByDate(tags = []) {
  return tags.reduce((obj, tag) => {
    let tagDates = tag.dates || []
    tagDates.forEach(tagDate => {
      if (!obj[tagDate]) {
        obj[tagDate] = []
      }
      obj[tagDate].push(getTagDetails(tag))
    })
    return obj
  }, {})
}

// Return the details components of the tag
// object. This does not return the dates
function getTagDetails(tag) {
  return {
    color: tag.color,
    label: tag.label
  }
}

// Finds the closest ancestor to the element
// with a definite position
function getPositionedAncestor(el) {
  // The element has no parents, bail out
  if (!el) {
    return null
  }

  // Are we at the top?
  if (el.nodeName.toUpperCase() === 'HTML') {
    return el
  }

  // Test for a positioned value
  const positionedValues = ['sticky', 'absolute', 'relative', 'fixed']
  if (positionedValues.includes(el.style.position).valueOf()) {
    return el
  }

  // Not positioned, recurse
  return getPositionedAncestor(el.parentNode)
}

// Display the day selection view on the calendar
function switchToDayView(inputId) {
  let daysContainer = document.getElementById(makeDaysContainerId(inputId))
  let monthsContainer = document.getElementById(makeMonthsContainerId(inputId))
  monthsContainer.classList.add('calendarify-display-none')
  daysContainer.classList.remove('calendarify-display-none')
}

// Display the month selection view on the calendar
function switchToMonthView(inputId) {
  let daysContainer = document.getElementById(makeDaysContainerId(inputId))
  let monthsContainer = document.getElementById(makeMonthsContainerId(inputId))
  daysContainer.classList.add('calendarify-display-none')
  monthsContainer.classList.remove('calendarify-display-none')
}

// Toggles between month and day selection views on the calendar
function toggleView(inputId) {
  let daysContainer = document.getElementById(makeDaysContainerId(inputId))
  let monthsContainer = document.getElementById(makeMonthsContainerId(inputId))
  daysContainer.classList.toggle('calendarify-display-none')
  monthsContainer.classList.toggle('calendarify-display-none')
}

// Run once
function initialSetUp() {
  if (!document.calendarify) {
    // Add calendar info to the document object
    // This is occasionally frowned upon as a practice
    // but it is often used by client-side libraries
    // and it prevents the general variable scope from
    // being polluted
    document.calendarify = {
      setUpComplete: true,
      calendars: {},
    }

    // Close all calendars on blur/click outside
    window.addEventListener('click', e => {
      let el = e.target
      do {
        if (el.classList && el.classList.contains('calendarify')) {
          // Found a calendar, or an input, leave it open
          return
        }
        el = el.parentNode
      } while (el)

      // No calendar was found,
      // close them all
      let { calendars } = document.calendarify
      Object.keys(calendars).forEach(calendarId => {
        switchToDayView(document.calendarify.calendars[calendarId].inputId)
        document.getElementById(calendarId).classList.add('calendarify-display-none')
      })
    })

    // Close all calendars on window resize
    window.addEventListener('resize', e => {
      document.querySelectorAll('.calendarify.calendarify-popout').forEach(el => {
        switchToDayView(document.calendarify.calendars[el.id].inputId)
        el.classList.add('calendarify-display-none')
      })
    })
  }
}

// Creates a calendar from an <input> element
function calendarify(selector, opts = {}) {
  let el = document.querySelector(selector)

  if (!el) {
    return console.log(`Could not calendarify ${selector} as it could not be found!`);
  }

  // Check element is an <input>
  if (el.tagName.toUpperCase() !== 'INPUT') {
    return console.log(`Could not calendarify ${selector} as it is not an input!`);
  }

  // Ensure set up has run
  initialSetUp()

  // Give the element an identifier, if one
  // wasn't specified
  if (!el.id) {
    el.id = getRandomUID()
  }

  // Specify some attributes
  if (!el.getAttribute('placeholder')) {
    el.setAttribute('placeholder', getDateFormat())
  }

  // Specify a generic pattern to match any locale-specific date format
  // TODO: this may have problems.
  // el.setAttribute('pattern', '\d{2,4}[- /.]\d{2,4}[- /.]\d{2,4}')

  // The title attribute is shown for erroneous input
  el.setAttribute('title', getDateFormat())

  // Ensure the element isn't doing its own matching
  el.setAttribute('type', 'text')

  // Create a unique ID for the calendar element
  let calendarId = makeCalendarId(el.id)

  // Add the calendar to the document object
  let { tags } = opts
  let date = makeDefaultDate(el, opts)

  document.calendarify.calendars[calendarId] = {
    inputId: el.id,
    calendarId,
    date,
    tags
  }

  // Create a positioned container and
	// append the input and the calendar
	let containerEl = document.createElement('span')
  containerEl.style.position = 'relative'
  el.parentNode.appendChild(containerEl)

  // Add the icon to the input element
  let iconEl = document.createElement('a')
  iconEl.classList.add('show-calendar-icon')
  iconEl.setAttribute('data-calendar', calendarId)
  iconEl.innerHTML = makeArrowIcon(270)
  iconEl.addEventListener('click', handleOpenCalendarClick)

  let iconContainerEl = document.createElement('div')
  iconContainerEl.classList.add('input-icon')
  iconContainerEl.appendChild(iconEl)

  // Create a container element for the input group
  // This is inserted as a child of the input element's parent
  let inputContainerEl = document.createElement('div')
  inputContainerEl.classList.add('calendarify', 'calendarify-row', 'calendarify-input-group')
  el.parentNode.appendChild(inputContainerEl)

  // Inject calendar div
  // This is inserted as a child of the input element's parent
  let calendarContainerEl = document.createElement('div')
  calendarContainerEl.id = calendarId
  calendarContainerEl.classList.add('calendarify', 'calendarify-popout', 'calendarify-display-none')
  el.parentNode.appendChild(calendarContainerEl)

  // Build up the calendar content
  let calendarTopMonthEl = document.createElement('div')
  calendarTopMonthEl.classList.add('month')
  calendarTopMonthEl.addEventListener('click', handleToggleMonthSelecionClick)

  let calendarTopMonthContainerEl = document.createElement('div')
  calendarTopMonthContainerEl.classList.add('month-container')

  let calendarTopMonthPrevIconEl = document.createElement('a')
  calendarTopMonthPrevIconEl.classList.add('icon')
  calendarTopMonthPrevIconEl.innerHTML = makeArrowIcon(90)
  calendarTopMonthPrevIconEl.addEventListener('click', handlePrevMonthClick)

  calendarTopMonthContainerEl.appendChild(calendarTopMonthPrevIconEl)
  calendarTopMonthContainerEl.appendChild(calendarTopMonthEl)

  let calendarTopYearContainerEl = document.createElement('div')
  calendarTopYearContainerEl.classList.add('year-container')

  let calendarTopYearNextIconEl = document.createElement('a')
  calendarTopYearNextIconEl.classList.add('icon')
  calendarTopYearNextIconEl.innerHTML = makeArrowIcon(270)
  calendarTopYearNextIconEl.addEventListener('click', handleNextMonthClick)

  let calendarTopYearEl = document.createElement('div')
  calendarTopYearEl.classList.add('year')

  calendarTopYearContainerEl.appendChild(calendarTopYearEl)
  calendarTopYearContainerEl.appendChild(calendarTopYearNextIconEl)

  let calendarTopEl = document.createElement('div')
  calendarTopEl.classList.add('calendarify-row', 'top')
  calendarTopEl.appendChild(calendarTopMonthContainerEl)
  calendarTopEl.appendChild(calendarTopYearContainerEl)

  calendarContainerEl.appendChild(calendarTopEl)
  
  // Add a container for the calendar, in day view
  let calendarDaysContainerEl = document.createElement('div')
  calendarDaysContainerEl.classList.add('calendarify-container-days')
  calendarDaysContainerEl.id = makeDaysContainerId(el.id)

  // Now create the headings, and the days themselves
  let calendarHeadingsEl = document.createElement('div')
  calendarHeadingsEl.classList.add('calendarify-row', 'headings')

  // Get the (locale-specific) weekdays
  const weekdays = moment.weekdaysShort(true)
  for (let i = 0; i < CALENDARIFY_DAYS; i++) {
    let headingEl = document.createElement('div')
    headingEl.classList.add('heading')
    headingEl.innerHTML = weekdays[i]
    calendarHeadingsEl.appendChild(headingEl)
  }

  calendarDaysContainerEl.appendChild(calendarHeadingsEl)

  // Create the rows
  for (let i = 0; i < CALENDARIFY_ROWS; i++) {
    let rowEl = document.createElement('div')
    rowEl.classList.add('calendarify-row')

    // Create the days of the week
    for (let j = 0; j < CALENDARIFY_DAYS; j++) {
      let dayEl = document.createElement('div')
      dayEl.classList.add('day')
      rowEl.appendChild(dayEl)
    }
    calendarDaysContainerEl.appendChild(rowEl)
  }

  // Add hyperlink controls to bottom
  let bottomTodayLinkEl = document.createElement('a')
  bottomTodayLinkEl.innerHTML = 'Select today\'s date'

  let bottomEl = document.createElement('div')
  bottomEl.classList.add('calendarify-row', 'bottom')
  bottomEl.appendChild(bottomTodayLinkEl)
  bottomTodayLinkEl.addEventListener('click', handleTodayClick)

  // Only show legend controls if there are tags
  if (tags && tags.length) {
    let bottomLegendLabelEl = document.createElement('span')
    bottomLegendLabelEl.innerHTML = 'Legend:'
    bottomEl.appendChild(bottomLegendLabelEl)

    let legendEl = document.createElement('div')
    legendEl.classList.add('legend', 'calendarify-row')
    legendEl.id = makeLegendId(el.id)
    bottomEl.appendChild(legendEl)

    // Retrieve the details from the tags object
    tags.forEach((tag, i) => {
      let tagDetails = getTagDetails(tag)
      let legendItemContainerEl = document.createElement('div')
      legendItemContainerEl.classList.add('legend-item', 'calendarify-row')

      let legendItemPipEl = document.createElement('div')
      legendItemPipEl.classList.add('legend-tag')
      legendItemPipEl.style.backgroundColor = tagDetails.color

      let legendItemLabelEl = document.createElement('div')
      legendItemLabelEl.classList.add('legend-label')
      legendItemLabelEl.innerHTML = tagDetails.label || `Tag #${i}`

      legendItemContainerEl.appendChild(legendItemPipEl)
      legendItemContainerEl.appendChild(legendItemLabelEl)
      legendEl.appendChild(legendItemContainerEl)
    })

    // Add the legend id to the document object
    document.calendarify.calendars[calendarId].legendEl = legendEl.id
  }
  
  // Add the legend/bottom row
  calendarDaysContainerEl.appendChild(bottomEl)
  
  // Add the days container to the calendar element
  calendarContainerEl.appendChild(calendarDaysContainerEl)
  
  // Create a container for the months view
  let calendarMonthsContainerEl = document.createElement('div')
  calendarMonthsContainerEl.classList.add('calendarify-container-months', 'calendarify-display-none')
  calendarMonthsContainerEl.id = makeMonthsContainerId(el.id)
  
  // Get the (locale-specific) months
  const months = moment.monthsShort(true)
  for (let i = 0; i < CALENDARIFY_MONTH_ROWS; i++) {
    let calendarMonthRow = document.createElement('div')
    calendarMonthRow.classList.add('calendarify-row')
    for (let j = 0; j < CALENDARIFY_MONTHS_PER_ROW; j++) {
      let monthEl = document.createElement('div')
      monthEl.classList.add('month')
      monthEl.innerHTML = months[i*CALENDARIFY_MONTHS_PER_ROW + j]
      monthEl.addEventListener('click', handleCalendarMonthClick)
      calendarMonthRow.appendChild(monthEl)
    }
    calendarMonthsContainerEl.appendChild(calendarMonthRow)
  }
  
  // Add the months container to the calendar element
  calendarContainerEl.appendChild(calendarMonthsContainerEl)

  // Move the original input element, as well as the icon
  // elements, to be children of the new container
  inputContainerEl.appendChild(el)
  inputContainerEl.appendChild(iconContainerEl)

  // Add the input container and the calendar container to the
	// overall, positioned container
	containerEl.appendChild(inputContainerEl)
  containerEl.appendChild(calendarContainerEl)

  // Populate the calendar with data
  updateCalendar(calendarId)

  // Finally, add an event listener to the input itself
  el.addEventListener('change', handleInputChange)
}

function updateCalendar(calendarId) {
  // Grab the calendar info object
  let calendarInfo = document.calendarify.calendars[calendarId]
  let { selectedDate, legendId, tags, date } = calendarInfo

  // Get the calendar element
  let calendarEl = document.getElementById(calendarId)

  // Set month, year from date
  let topEl = calendarEl.getElementsByClassName('top')[0]
  topEl.getElementsByClassName('month')[0].innerHTML = date.format('MMMM')
  topEl.getElementsByClassName('year')[0].innerHTML = date.format('YYYY')

  // Retrieve the elements in the calendar
  let dayElems = calendarEl.getElementsByClassName('day')
  let index = 0

  // Navigate to the start of the month
  // and then the beginning of that week
  let month = moment(date, getDateFormat()).startOf('month').startOf('week')

  // Transform tags into a list of tags per date
  let tagsByDate = makeTagsByDate(tags)

  // Begin at the start of the week
  // and fill in the days from the last month
  while(month.date() !== 1) {
    let tagsToAdd = tagsByDate[month.format(CALENDARIFY_TAG_DATE_FORMAT)]
    populateDay(dayElems[index], month, selectedDate, tagsToAdd, ['last-month'])
    month.add(1, 'days')
    index++
  }

  // Then populate the days of the target month
  do {
    let tagsToAdd = tagsByDate[month.format(CALENDARIFY_TAG_DATE_FORMAT)]
    populateDay(dayElems[index], month, selectedDate, tagsToAdd)
    month.add(1, 'days')
    index++
  } while(month.date() !== 1)

  // Finally, fill the days from the next month
  while(index < (CALENDARIFY_ROWS * CALENDARIFY_DAYS)) {
    let tagsToAdd = tagsByDate[month.format(CALENDARIFY_TAG_DATE_FORMAT)]
    populateDay(dayElems[index], month, selectedDate, tagsToAdd, ['next-month'])
    month.add(1, 'days')
    index++
  }
}
