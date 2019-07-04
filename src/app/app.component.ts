import { Component } from '@angular/core';
import { MapareaComponent } from './maparea/maparea.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Air Quality Monitor';

  newLatitude: Number = 0;
  newLongitude: Number = 0;

  onLocationChange(location: any): void  {
    console.log( "AppComponent.onLocationChange", location );
    this.newLatitude = location.latitude;
    this.newLongitude = location.longitude;
  }

  mapLatitude: Number = 0;
  mapLongitude: Number = 0;
  mapStation: string = "";

  onMapStationChange( newLocation: any ): void {
    console.log( "AppComponent.onMapStationChange", location );
    this.mapLatitude = newLocation.latitude;
    this.mapLongitude = newLocation.longitude;
    this.mapStation = newLocation.station;
  }

}

