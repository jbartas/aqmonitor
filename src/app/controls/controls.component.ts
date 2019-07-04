import { Component, OnInit, EventEmitter, Output, Input, 
    OnChanges, SimpleChanges } from '@angular/core';
import { AqserviceService } from '../aqservice.service';


@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.css'],
  providers: [ AqserviceService ]
})

export class ControlsComponent implements OnInit, OnChanges {

  title = 'Air Quaility Around the World';

  @Input()
  currentCity: string;

  latLongCoords: string;
  msg: string;
  locationStatus: string = "Pending";

  @Input()
  latitude: number  = 0;
  @Input()
  longitude: number = 0;

  cityList: any = null;       // return from lookupCity
  displayMonitors: string[] = ["Boston", "San Jose"];  // list of locations to display

  @Output() 
	locationChange: EventEmitter<any>;

  constructor( private aqService: AqserviceService ) { 
    this.locationChange = new EventEmitter<any>();
  }

  ngOnInit() {
    // Get the location from the browser. 
    if( !navigator.geolocation ) {
      this.currentCity = "Location Unavailable"
    }
    else {
      this.getLocation();
      this.currentCity = "Loading...";
    }

    // Get any saved mopnitors back from local storage
    if( localStorage.displayMonitors ) {
      let monjson = localStorage.getItem("displayMonitors");
      // use our logic to stuff these in list
      let monArray = JSON.parse( monjson );
      for( let i = 0; i < monArray.length; i++) {
        this.addDisplayMonitor( monArray[i] );
      } 
    }    
  }

  ngOnChanges( changes: SimpleChanges) {
    console.log("controls changed: ", changes );
    //if monitor station chaged in map then add it to list
     if( changes.currentCity ) {
       this.addDisplayMonitor( this.currentCity );
     }
     this.latitude = Math.round(this.latitude * 10000) / 10000 ;
     this.longitude = Math.round(this.longitude * 10000) / 10000 ;
  }

  /* Add a display monitor to the list. Checking of duplicates 
   * and other unwanted entries is done here. 
   */
  addDisplayMonitor( monitor: string ) {
    if( monitor == "" ) {
      return;   // don';'t add null strings
    }
    // make sure string is not already in list
    for( let i = 0; i < this.displayMonitors.length; i++ ) {
        if( this.displayMonitors[i] == monitor )
          return;
    }
    this.displayMonitors.unshift( monitor );
    localStorage.setItem( "displayMonitors", 
        JSON.stringify(this.displayMonitors ) );
  }

  clearDisplayMonitors() {
    this.displayMonitors = [ this.currentCity ];
    localStorage.removeItem( "displayMonitors" );
  }

  /* This is a callbak (subscription) to handle the result of a city 
   * air quailty lookup. It may have been invoked by city or by lat/long
   */
  aqLookupResult( result: any, type: string ) {
      this.cityList = result;
      console.log( "this.cityList: ", this.cityList );
      let numStations = 0;    // new stations from this lookup

      if( result.status != "ok" ) {
        let msg = "Error " + result.status + " reading city " + this.currentCity;
        this.currentCity = msg; 
      }
      else if ( result.data.length == 0 ) {
        this.currentCity = "No monitors nearby";
      }
      else {

        // if we got a valid lat/long for city, then update
        if( type == "City" ) {
          // make a list of city monitors in the result 
          //for( let i = 0; i < result.data.length; i++) 
          result.data.forEach(  (item: any) => {
            this.addDisplayMonitor( item.station.name );
            numStations++;
          })
          if( this.cityList.data[0].station.geo[0] ) {
            this.latitude = this.cityList.data[0].station.geo[0];
            this.longitude = this.cityList.data[0].station.geo[1]; 
          }
        }
        if( type == "Coords" ) {
          if( this.cityList.data ) {
            this.currentCity = this.cityList.data.city.name;
            this.addDisplayMonitor( this.currentCity );
            numStations++;
            this.latitude = this.cityList.data.city.geo[0];
            this.longitude = this.cityList.data.city.geo[1]; 
          }
        }

        // send location over to map module
        this.sendLocation();
      }
  }

  /* Look up air quality for a city. This is the city button 
   * click handler.
   */
  aqLookupCity() {
      this.aqService
          .lookupCity( this.currentCity )
          .subscribe( (result: any) => this.aqLookupResult( result, "City" ) );
  }

  /* Look up air quality for a location, given by the current 
   * lat & long  co-ords. This called at init based on the 
   * current location lat & long from the browser.
   */
  aqLookupCoords() {
    this.aqService
        .lookupCoords( this.latitude, this.longitude )
        .subscribe( (result: any) => this.aqLookupResult( result, "Coords" ) );

  }

  // Handle click on alternate monitor in table
  monitorClick( newMonitorName: any ) {
    console.log( newMonitorName );
    this.currentCity = newMonitorName;
    this.aqLookupCity();
  }

  sendLocation() {
    // Send lat & long to map module
    let location  = { 
      event: "location", 
      latitude: this.latitude, 
      longitude: this.longitude 
    };

    console.log("controls: Sending location to map");
    console.log( location );
    this.locationChange.emit( location );
    return
  }

  // get current geolocation from browser
  getLocation() {
    // clear previous location, if any:
    this.latitude = 0;
    this.longitude = 0;
    this.locationStatus = "Requesting location";

    var options = {
      enableHighAccuracy : true,
      timeout : 10000,      // 10 second timeout may be aggressive
      maximumAge : 30000    // Allow 30 second old data
    };
  
    navigator.geolocation.getCurrentPosition( 
      position => { this.locationCallback( position ) },
      error => { this.locationErrorCallback( error ) },
      options );
  }

  // Callback for getLocation
  locationCallback( position: any ) {
    this.latitude = position.coords.latitude;
    this.longitude = position.coords.longitude;
    
    // Build a status string with the location info
    this.locationStatus = "location: lat: " + 
        this.latitude + ", long: "  + this.longitude;

    // Just for my own curiousity...
    console.log( this.locationStatus + ", accuracy: " + 
        position.coords.accuracy );

    this.currentCity = "Your Location";
    this.aqLookupCoords();    // get stations and update the map display
  }

  locationErrorCallback( error: any ) {
    console.log("location: callback error, e: " + error.code, error ); 
    switch(error.code) {
      case 1:
          this.locationStatus = "The user denied permission";
          break;
      case 2:
        this.locationStatus = "Position is unavailable";
          break;
      case 3:
        this.locationStatus = "Timed out";
          break;
    }
  }

}
