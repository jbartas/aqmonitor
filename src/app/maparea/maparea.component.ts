/// <reference types="@types/googlemaps" />
import { Component, OnInit, EventEmitter, Input, Output, 
  OnChanges, SimpleChanges } from '@angular/core';
import { timer } from 'rxjs';
import { AqserviceService } from '../aqservice.service';
import { ViewChild } from '@angular/core';


@Component({
  selector: 'app-maparea',
  templateUrl: './maparea.component.html',
  styleUrls: ['./maparea.component.css'],
  providers: [ AqserviceService ]
})


export class MapareaComponent implements OnInit, OnChanges {

  @ViewChild('gmap') gmapElement: any;
  map: google.maps.Map;

  loadingMap: string = "Loading map...";
  timer: any;
  zoomTimer: any;   // timer for debouncing zoom refresh

  // Latitude, longitude, and station name at center of map
  @Input()
  latitude: number  = 0;
  @Input()
  longitude: number = 0;
  station_name: string = "";

  @Output() 
	locationChange: EventEmitter<any>;

  // other stations on the map
  otherStations = new Array();

  // Amount of lat/long units to use for area search 
  rangeFactor: number = 0.5;

  polluteInfo: any;
  displayMap: any;
  zoomFactor: number = 11;         // how "zoomed" map is
  subZoomTimer: any = undefined;

  constructor( private aqService: AqserviceService ) {
    this.locationChange = new EventEmitter<any>();
   }

  ngOnInit() {
    this.timer = timer(1000,500);
    this.timer.subscribe( x =>{
      this.eachSecond();
    });
  }

  ngOnChanges( changes: SimpleChanges) {
    console.log("ngOnChanges: ",  changes );

    // If we we have a valid lat & long, load Map
    if( changes.latitude || changes.longitude ) {
      if( this.latitude != 0 && this.longitude != 0) {
        this.loadMap();
      }
    }
  }

// Send info for a clicked map station to the controls panel
sendClickedStation( ) {
    // Send lat & long to map module
    let location  = { 
      event: "location", 
      station: this.station_name,
      latitude: this.latitude, 
      longitude: this.longitude 
    };

    console.log("mapArea: Sending location to conrols");
    console.log( location );
    this.locationChange.emit( location );
    return
  }

  /* Timer for map zoom/pan. We delay this as a sort 
   * of "debounce" function so we're not hammering the API if the 
   * user is  slowly dragging the map.
   */
  setZoomTimer() {
      console.log("SetZoomTimer: sub: ", this.subZoomTimer);
      // If timer is already running then clear it
      if( this.subZoomTimer ) {
        this.subZoomTimer.unsubscribe();
      }
      this.zoomTimer = timer(700, 50000);
      this.subZoomTimer = this.zoomTimer.subscribe( x =>{
        console.log("SetZoomTimer: fired:");
        this.aqLookupArea();
        this.subZoomTimer.unsubscribe();
    });
  }


  markerColors = [ "#66FF88", "#88CC77", "#99AA66", "orange", 
                  "#AA6688", "red", "#CC00FF",  
                  "#880044", "#440044" ];

  markerBgColors = [ "#B0FFBB", "#DFEFBB", "#DDDD66", "#EECC88", 
                  "#EEAACC", "#FFAAAA", "#BA88CC",  
                  "#CC88AA", "#AA77AA" ];

  getColors( aqi ) {
    let color = "black";
    let bgColor = "white"
    // set index into colors table
    if( aqi == -1) {
      color = "blue";
    }
    else {
      let index = Math.floor(aqi/10);
      if( index >= this.markerColors.length ) {
        index = this.markerColors.length - 1;
      }
      color = this.markerColors[ index ];
      bgColor = this.markerBgColors[ index ];
    }
    return { stroke: color, fill: "#000088", bg: bgColor };
  }

  // make a marker for the map 
  makeMarker( position, aqi: number ) {

    let colors = this.getColors( aqi );

    let marker_info = {
      path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
      scale: 4,
      fillColor: colors.fill,
      fillOpacity: 1,
      strokeColor: colors.stroke
    };

    let marker = new google.maps.Marker(
        { position: position, 
          icon: marker_info, 
          animation:google.maps.Animation.DROP,
          map: this.map } 
        );
    return marker;
  }
  
  loadMap()
  {
    console.log("loading map; lat: " + this.latitude + 
              ", long: " + this.longitude );

    // Set up the map properties wanted by Gioogle maps API
    let map_center = new google.maps.LatLng( this.latitude, this.longitude );
    let mapProp = {
      center: map_center,
      zoom: this.zoomFactor,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true
    };

    // Load the map onto the screen
    this.map = new google.maps.Map(this.gmapElement.nativeElement, mapProp);
    this.map.addListener( "bounds_changed", () => {
      this.zoomFactor = this.map.getZoom();
      console.log("Map change; zoom:", this.zoomFactor);
      this.setZoomTimer();
    } );

    // go get the pollution info for the centered station
    this.aqService
          .lookupCoords( this.latitude, this.longitude)
          .subscribe( (result: any ) =>  { 
            console.log( "lookupCoords returned ", result );
            this.polluteInfo = result;

            // Did we change the selected station? 
            if( this.station_name != this.polluteInfo.data.city.name ) {
              this.station_name = this.polluteInfo.data.city.name;
              this.sendClickedStation();
            }

            // put a marker on the stations map location 
            let marker = this.makeMarker( map_center, result.data.aqi );
            marker.setLabel( this.station_name );

            if( this.polluteInfo.status != "ok" ) {
              marker.setTitle( "Station is off-line" );  
            }
            else {
              let updated: string = "Last Update: " + this.polluteInfo.data.time.s;

              let info_text = this.format_aqdata();
              /* The google maps infoWindow won't take styles from the CSS, 
               * have to hardcode them >:-())
               */
              let bgcolor = this.getColors( result.data.aqi ).bg;
              let style = "style=\"padding: 0.4em; margin: 0.1em; font-weight: 500; " + 
                "line-height=50%;  background-color: " + 
                bgcolor + ";\"";
              let infowindow = new google.maps.InfoWindow({
                content: "<div " + style + " >" + info_text + "</div>"
              });

              marker.setTitle( updated );
              let tmpMap = this.map;  // for passing to Inforwindow.open()
              marker.addListener('click', function() {
                infowindow.open( tmpMap, marker);
              });
              infowindow.open( this.map, marker);
            }

            this.aqLookupArea();   // find other stations in the area
          })
  }


  /* Look up stations in the area surrounding lat & long. This may return nothing, 
   * or a long list. The returned data only contain lat. long, and AQI. The idea 
   * is we add the best entries to the displayMonitors list and also pass the to 
   * the map for possible disply.
   */
  aqLookupArea() 
  {
    let bounds = this.map.getBounds();
    let bounds_ne = { "lat": bounds.getNorthEast().lat(), 
        "lng": bounds.getNorthEast().lng() };
    let bounds_sw = { "lat": bounds.getSouthWest().lat(), 
        "lng": bounds.getSouthWest().lng() };

    console.log( "aqLookupArea: bounds: ", bounds_ne, bounds_sw );

    this.aqService
      .lookupArea( bounds_sw.lat, bounds_sw.lng, bounds_ne.lat, bounds_ne.lng )
      .subscribe( (result: any) => {
        if (result.status != "ok") {
          console.log("Area reply error ", result.data);
        }
        else {
          this.otherStations.length = 0;   // clear list of nearby stations
          console.log("Got ", result.data.length, "area results.");
          this.otherStations = result.data;
          console.log( "Stations on map: ", this.otherStations );
        }

        // make map markers for nearby stations
        for( let i = 0; i < this.otherStations.length; i++) {
          let station = this.otherStations[i];
          if( this.ll_isclose( station.lat, this.latitude ) && 
              this.ll_isclose( station.lon, this.longitude ) ) {
            continue;
          }
          let g_location = new google.maps.LatLng( station.lat, station.lon );
          let marker = this.makeMarker( g_location , -1 );
          marker.setTitle( "Click to center." );

          let tmpThis = this;
          marker.addListener('click', function() {
            tmpThis.gotoMarker( marker );
          })

          // Start a request for specific data for this marker
          this.aqService
          .lookupCoords( station.lat, station.lon )
          .subscribe( (result: any  ) =>  { 
            //console.log( "lookupCoords (marker) returned ", result );
            if( result.status != "ok" ) {
              console.log( "lookupCoords (marker) error");
            }

            // find the marker & fix it up
            marker.setTitle(  result.data.city.name + 
              "\nAir Quality Index: " + result.data.aqi );

            //  console.log( marker);
            let colors = this.getColors( result.data.aqi );

            let marker_icon = {
              path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 4,
              fillColor: colors.fill,
              fillOpacity: 1,
              strokeColor: colors.stroke
            };
            marker.setIcon( marker_icon );
          })
        }
      })
  }

  gotoMarker( marker: google.maps.Marker ) {
    // reload map for markers lat/long location
    let latLng = marker.getPosition();    // goggly stuff
    this.latitude = latLng.lat();         // set local vars
    this.longitude = latLng.lng();
    this.loadMap();
  } 

  // return true if two lat/long values are very close to each other
  ll_isclose( ll1, ll2 ) {
    if(( (ll1 - ll2 ) < 0.0001 ) &&
        (( ll1 - ll2 ) > -0.0001 )) {
          return true;
        }
    return false;
  }

  format_aqdata()
  {
    let d = this.polluteInfo.data; 
    let iaqi = d.iaqi;

    let tmp = "Station: " + d.city.name + "</br>";
    tmp += "Last Update: " + d.time.s;
    tmp += "<hr>";
    if( iaqi['no2'] )
      tmp += "Nitrous Oxide: " + d.iaqi.no2.v + "</br>";
    
    if( iaqi['o3'] )
      tmp += "Oxone: " + d.iaqi.o3.v + "</br>";
    
    if( iaqi['so2'] )
      tmp += "Sulfur Dioxide: " + d.iaqi.so2.v + "</br>";

    if( iaqi['pm10'])
      tmp += "PM-10: " + d.iaqi.pm10.v + "</br>";

    if( iaqi['pm25'])
      tmp += "PM-25: " + d.iaqi.pm25.v + "</br>";

    if( d['attributions'] && d['attributions'].length != 0 ) {
      let url = "<a href=\"" + d.attributions[0].url + 
        "\" target=\"_blank\" >" + 
        d.attributions[0].url + "</a>";

      tmp += "Link: " + url;
    }
    return tmp;
  }

  // Timer which fires every second, for various housekeeping
  eachSecond() {    
    this.loadingMap += "."; // add dots to "loading" message
    if( this.loadingMap.length > 20 ) {
      this.loadingMap = "Loading map..";
    }
  }
}
