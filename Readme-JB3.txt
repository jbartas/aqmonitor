Readme For John Bartas CS-701 Term project.

Overview:

For the term project I chose to produce an interactive website which
displays information gathered from pollution monitoring stations around
the world. The data is collected by http://www.waqi.info/, and made
available via a JSON API. They have data from over 12,000 stations,
including a good selection in both the San Jose area and Boston areas.

The GUI:

I chose to map the data from stations to a Google maps based display.
The Application screen is divided up into 4 rectangles; a large map area
(for the google map) which takes up most of the screen, a "controls"
panel on the right, and two wide rectangles on the bottom for displaying
bar charts.

The user types in a City or location in control panel, and a REST
request is made to the WAQI service for that city. The service endeavors
to return information for the selected city, and if that's not found,
then nearby cities. The location can also be select by manually typing
in a latitude and longitude (location) in the control panel.

The select location is send as an emitted event to the map-area module,
which loads a google map for the coordinates and sends a request for
data from all stations contained in the map. As the data requests are
answered (via subscription to the "aqService" Service I created as a
wrapper for the WAQI API) the markers for the stations are displayed on
the screen. Initially the color is blue, however as we obtain pollutant
data the colors are changes to reflect the air quality, with green been
the best, ranging though orange, read, and violet as the quality worsens.

This Marker that was selected by the user is displayed at the center of
the map, with a text overlay detailing the amounts of the pollutants
detected by that monitor. Clicking on another marker on the map results
in the map being redrawn with the clicked marker appearing in the
center. and having the text overlay.

The bar-chart areas at the bottom of the page are designed to contain
historical pollution data (on the left) and future pollution predictions
(on the right) Currently these display daily numbers for seven days each
(past and future).

Monitor stations which are visited are saved to a Stations list, which
is displayed in the control panel. The list is saved ion local Storage.
A button is provided to clear the list.


User Walk-through:

1) Find a working URL or start the application with the agular utility
(in which case the URL will usually be "localhost:420".
2) The browser will ask for you local geolocation, and then look for the
nearest monitoring station.
3) That station along with results of the latest AQ (Air Quality) will
be displayed in the maps area.
4) Other nearby stations may also be displayed on the map. You can
select them by clicking on the markers. Data will be fetched for them
and they will be moved to the center of the map.
5) You can also select stations by entering a City name ("Boston, "San
Jose") in the control panel., or by typing in a known latitude and
longitude in the provided text inputs.
6) you can move the map holding down the left mouse button and dragging.
7 You can zooM in/out on the map with the mouse scroll wheel.


Angular 2:

Internally there are 3 major angular 2 modules, and one service. The
modules are controls, map-area, and charts, which control the similarly
named areas on the screen. The service is the aqMonitor service which
handles requests to the WAQI service by exporting several functions
which the called can subscribe to .

Events passed across modules are via emitters. There are only a few of
these -
1) When the controls module selects a city to chart, it sends the
location (lat & long) to the map area.
2) When the map-area has a city selected by the user clicking a marker,
it sends the name and location to the controls panel for display and
adding to the station list.
3) When the map-area get data for a clicked city, it sends the location
of the city to the charts module, which sends an aqService request of
it's own and then charts the data for the selected city.


Non-Angular features used:

* The Google maps API.
* Local Storage for the list of visited station.
* The ng2-charts library (an angular overlay for the D3 charts system.
* Browser Geolocation functionality


Notes and To-Do:

The past and predicted data feature is not yet implemented in the WAQI
API, so for now that data is simulated. We should add the actual data
when the service becomes available.

It would be good to age-out unused stations on the visited stations list.

When we have real chart data, we should look at what time interval to
display currently both charts are set for one  week.

 
Installing the code:

1) In a clean directory, unzip the provided aqmonitor.zip  file. This
will create all the normail Angular and node directories except for
node_module.
2) Install node modules in the usual way for a node application
3) Start angular: "ng serve" - this will create a listening server on
URL "localhost:4200."


Files listing

This program contain all the files created by the ng utility for a new
application. These are not listed here unless they were edited.

The following files were created with the "ng" cli as part of this
project and modified to implement the project. All these files are 
under angualr project  "src" directory

- top level files
index.html - the master index.html
styles.css - the master CSS file

- application wide files, edited as required for inter-module communication
app\app.component.css
app\app.component.html
app\app.component.ts
app\app.module.ts

- The Service for the WAQI JSON requests
app\aqservice.service.spec.ts
app\aqservice.service.ts

- The files for the Charts module
app\charts\charts.component.css
app\charts\charts.component.html
app\charts\charts.component.ts

- The files for the Control Panel module
app\controls\controls.component.css
app\controls\controls.component.html
app\controls\controls.component.ts

- The files for the Map area
app\maparea\maparea.component.css
app\maparea\maparea.component.html
app\maparea\maparea.component.ts


