import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import { AqserviceService } from '../aqservice.service';


@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.css'],
  providers: [ AqserviceService ]
})
export class ChartsComponent implements OnInit {

  pollutants: number = 5;  // We track 5 pollutants
  days: number = 7;       // over 7 days

  @Input()
  latitude: number  = 0;
  @Input()
  longitude: number = 0;

  constructor( private aqService: AqserviceService ) { 

  }

  ngOnInit() {

  }

  ngOnChanges( changes: SimpleChanges) {
    console.log("charts changed: ", changes );
    console.log("charting lat: "+ this.latitude + ", long: " + this.longitude );

    // Zero out any pre-existing  data
    for( let i = 0; i < this.pollutants; i++ ) {
      let initData = [ 0, 0, 0, 0, 0, 0, 0 ];
      this.pastChartData[i].data = initData;
      this.predictChartData[i].data = initData;
    }

    // Get data for new Lat/Long and stuff data arrays
    /*
     * Unfortunatly the WAQI service for past and predicted data is not 
     * available with the API yet (promised "in coming months").
     * For now, take a current reading and make fake data from it.
     */
    this.aqService
          .lookupCoords( this.latitude, this.longitude )
          .subscribe( (result: any) => this.aqLookupCallback( result ) );
  }

  // Callback from the lat/long pollution lookup
  aqLookupCallback( result ) {
    if( result.status != "ok" ) {
      console.log("charts: bad lookup result: ", result);
      return;
    }
    console.log("charts callback: ", result);

    // Some of these data items are not in every data set. Get the ones that exist
    let NOX = 0;
    if( result.data.iaqi.no2 ) {
      NOX = result.data.iaqi.no2.v;
    }
    let SOX = 0;
    if( result.data.iaqi.so2 ) {
      SOX = result.data.iaqi.so2.v;
    }
    let OZONE = 0;
    if( result.data.iaqi.o3 ) {
      OZONE = result.data.iaqi.o3.v;
    }
    let PM25 = 0;
    if( result.data.iaqi.pm25 ){
      PM25 = result.data.iaqi.pm25.v;
    }    
    let PM10 = 0;
    if( result.data.iaqi.pm10 ) {
      PM10 = result.data.iaqi.pm10.v;
    }

    this.pastChartData = this.makeFakeData( NOX, SOX, OZONE, PM25, PM10, 0 );
    this.predictChartData = this.makeFakeData( NOX, SOX, OZONE, PM25, PM10, 1 );
  }

    /* Bug in ng2-charts - we can't replace items in it's data 
     * section and have it update to the screen. Get around this by 
     * building a new data array and assigning it to the variable.
     * 
     * The pollutants are all passed, along with an "up" flag which 
     * indicate the chart should have days indexed high to low (past)
     * or low to high (future)
     * */
    makeFakeData( NOX, SOX, OZONE, PM25, PM10, up ) {
    let newData = [
      { data: [65, 59, 80, 81, 56, 55, 40], label: "NO"    },
      { data: [28, 48, 40, 19, 86, 27, 90], label: "Ozone" },
      { data: [25, 28, 49, 99, 86, 27, 90], label: "SO2"   },
      { data: [42, 32, 48, 40, 19, 86, 27], label: "PM.10" },
      { data: [21, 19, 86, 27, 90, 48, 40], label: "PM.25" }  
    ];
    for( let i = 0; i < 7; i++) {
      let index = up ? i : (6 - i) ;
      newData[0].data[ index ] = NOX;
      newData[1].data[ index ] = OZONE;
      newData[2].data[ index ] = SOX;
      newData[3].data[ index ] = PM10;
      newData[4].data[ index ] = PM25;
      NOX = this.adjustData(NOX);
      SOX = this.adjustData(SOX);
      OZONE = this.adjustData(OZONE);
      PM10 = this.adjustData(PM10);
      PM25 = this.adjustData(PM25);
    }
    return newData;
  }

  // randomiz data items
  adjustData( data ) {
    if( data == 0) {
      return 0;
    }
    let newData = data;
    let change = Math.random() - 0.5;

    // tweak data for believable ramdom changes
    if( data > 10)  {
      change = (change * 4);
    }
    else if( data > 3)  {
      change = (change * 2);
    }
    if( data > 40 ) {
      newData -= (change + 3);
    }
    else {
      newData += change;
    }
    // truncate long floats
    newData = Math.round( newData * 100) / 100;
    if( newData >= 0 ) {
      return newData;
    }
    else {
      return -newData;
    }
  }


  public barChartOptions = {
    scaleShowVerticalLines: false,
    responsive: true,
    maintainAspectRatio: false
  };

  public pastChartLabels = ['6/16', '6/17', '6/18', '6/19', '6/20', '6/21', '6/22' ];
  public predictChartLabels = ['6/24', '6/25', '6/26', '6/27', '6/28', '6/29', '6/30' ];
  public barChartType = 'bar';
  public barChartLegend = true;


  public barChartColors: Array<any> = [
    {  backgroundColor: ['#d18537', '#d18537', '#d18537', "#d18537", "#d18537", "#d18537", "#d18537"] },
    {  backgroundColor: ['#66aaff', '#66aaff', '#66aaff', "#66aaff", "#66aaff", "#66aaff", "#66aaff"]  },
    {  backgroundColor: ['#b080b5', '#b080b5', '#b080b5', "#b080b5", "#b080b5", "#b080b5", "#b080b5"]  },
    {  backgroundColor: ['#ffCCAA', '#ffCCAA', '#ffCCAA', "#ffCCAA", "#ffCCAA", "#ffCCAA", "#ffCCAA"]  },
    {  backgroundColor: ['#66cc33', '#66cc33', '#66cc33', "#66cc33", "#66cc33", "#66cc33", "#66cc33"]  },
  ]


  public pastChartData = [
    { data: [65, 59, 80, 81, 56, 55, 40], label: "NO"    },
    { data: [28, 48, 40, 19, 86, 27, 90], label: "Ozone" },
    { data: [25, 28, 49, 99, 86, 27, 90], label: "SO2"   },
    { data: [42, 32, 48, 40, 19, 86, 27], label: "PM.10" },
    { data: [21, 19, 86, 27, 90, 48, 40], label: "PM.25" }
  ];

  public predictChartData = [
    { data: [65, 59, 80, 81, 56, 55, 40], label: "NO"    },
    { data: [28, 48, 40, 19, 86, 27, 90], label: "Ozone" },
    { data: [25, 28, 49, 99, 86, 27, 90], label: "SO2"   },
    { data: [42, 32, 48, 40, 19, 86, 27], label: "PM.10" },
    { data: [21, 19, 86, 27, 90, 48, 40], label: "PM.25" }
  ];

}
