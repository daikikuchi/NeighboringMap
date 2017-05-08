# Neighboring Map with Google APIs and Wikipedia API
- Includes a text input field or dropdown menu that filters the map markers and list items to locations matching the text input or selection. 

- A list-view of location names is provided which displays all locations by default, and displays the filtered subset of locations when a filter is applied.

- Clicking a location on the list displays unique information about the location, and animates its associated map marker (e.g. bouncing)

- Map displays all location markers by default, and displays the filtered subset of location markers when a filter is applied.

- Clicking a marker displays unique information about a location in either an infoWindow or DOM element.

## View live version here: https://neighboringmap.appspot.com/

### Description: 

Map of parks in Christchurch NZ, with information retrieved via the Wikipedia api, as well as information provided by Google Map API and Google Places API

### Quickstart 

- clone this repository: `git clone https://github.com/daikikuchi/NeighboringMap.git`
- `cd NeighboringMap` 
- open file `index.html` in you preferred browser

### Technologies used 

- HTML
- CSS
- Javascript
- Knockout.js
- jQuery

### APIs used

- Google Maps Javascript API (https://developers.google.com/maps/documentation/javascript/)
- Google Places API to retrieve photos and details for locations
- Wikipedia API (https://www.mediawiki.org/wiki/API:Main_page)
