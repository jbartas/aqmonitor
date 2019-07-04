import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})


@Injectable()
export class AqserviceService {
  
/*  https://api.waqi.info/search/?token=c4d49e73e16d0dccfe57f0a0e711e652632f6a21&keyword=San+Jose
*/
  base_url: string = "http://api.waqi.info/";
  aqToken: string = "?token=c4d49e73e16d0dccfe57f0a0e711e652632f6a21";

  constructor( private http: HttpClient ) { }

  /* Send a request for City pollution monitor information. 
   * Returned list often inclueds a nunber of sites in the requested city 
   * or even cities with similar name (eg New Boston, Texas) 
   */
  lookupCity( city: string ) : Observable <any>  {
    let cmd: string = "search/"
    let url: string = this.base_url + cmd + this.aqToken + "&keyword=" + city;
    console.log("AQ requesting city URL: " + url );

    return this.http.get( url );
  }


  /* Send a request pollution data local to the passed lat/long. The lat/long 
   * should be taken form the result of a previous city lookup or you may get 
   * nothing back if there are no stations near that location.. 
   */
  lookupCoords( lat: number, long: number ) : Observable <any>  {
    let cmd: string = "feed/geo:" + lat + ";" + long + "/";
    let url: string  =  this.base_url + cmd + this.aqToken;
    //console.log("AQ requesting location URL: " + url );

    return this.http.get( url );
  }

  /* look up all the stations in a map area defined by the sets of lat/long coord \
   * passed. 
   */
  lookupArea( lat1: number, long1: number, lat2: number, long2: number ) : Observable <any>  {
    let cmd: string = "map/bounds/";
    let param =  "&latlng=" + lat1 + "," + long1 + ","   + lat2 + "," + long2 ;
    let url: string  =  this.base_url + cmd + this.aqToken + param;
    //console.log("AQ requesting map area URL: " + url );

    return this.http.get( url );

  }

}
