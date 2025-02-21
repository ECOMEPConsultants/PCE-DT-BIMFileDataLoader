/// <reference types="forge-viewer" />
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, lastValueFrom, take } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'ECO-MEP-Loader';
  forge_init = false;
  viewer3D: any;

  constructor(
    private httpClient: HttpClient
  ) {

  }

  ngOnInit(): void {
    this.init_forge();
    
  }

  private async fetch_acc_tok() {
    let _httpOptions = {
      headers: new HttpHeaders({
        Authorization: `Basic WGZEbVpBdjkxMkZQaXYxWDJSeWFTMUozYTZMZWVHc0FaQnEyZHEzN0JuZ3k5Mk40OnVXMHpHWmN2a1FaNWxIeUNGNEFJajhDaHNNTDlQMXhHanlHdEFtSGRFNDNsNjlhUHlZSk12azlNWHBKMXFiYnI=`,
        'Content-Type': 'application/x-www-form-urlencoded',

      })
    };
    let body = new URLSearchParams();
    body.set('grant_type', 'client_credentials')
    body.set('scope', 'data:read bucket:read')
    let _resp: any;
    _resp = await this.httpClient.post("https://developer.api.autodesk.com/authentication/v2/token", body.toString(), _httpOptions).toPromise();
    return _resp;

  }

  private async fetch_models(acc_tok: string) {
    let _httpOptions = {
      headers: new HttpHeaders({
        Authorization: `Bearer ${acc_tok}`,
        'Content-Type': 'application/x-www-form-urlencoded',

      })
    };

    let _resp: any;
    _resp = await this.httpClient.get("https://developer.api.autodesk.com/oss/v2/buckets/dt-proj-bucket-1/objects", _httpOptions).toPromise();
    // debugger
    return _resp;

  }

  private urn_name_map = {
    // 'urn': 'urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6ZHQtcHJvai1idWNrZXQtMS9IUmlzaGFicmFqLUdNQTYzJTIwQ29vcmRpbmF0ZWQubndk',
    // 'name': 'GMA63-V2'

    'urn': 'urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6ZHQtcHJvai1idWNrZXQtMS9NYW5nYWwlMjBCdWlsZGhvbWUtTWFsYWQlMjBHYXV0YW1fQ29vcmRpbmF0ZWRfUjQubndk',
    'name': 'Mangal Buildhome-V2'
  }

  public async init_forge() {
    if (this.forge_init) {
      return;
    }
    this.forge_init = true;
    let acc_tok = await this.fetch_acc_tok().then((data: any) => {
      return data['access_token']
    })
    this.fetch_models(acc_tok)

    var htmlDiv = document.getElementById('forgeViewer')!;
    let viewer = new Autodesk.Viewing.GuiViewer3D(htmlDiv);
    var options = {
      env: 'AutodeskProduction',
      api: 'derivativeV2',
      disableBrowserContextMenu: true,
      experimental: ['no-debug'],
      getAccessToken: async function (onTokenReady: any) {
        var token = acc_tok;
        var timeInSeconds = 3600; // Use value provided by APS Authentication (OAuth) API
        onTokenReady(token, timeInSeconds);
      }
    };

    // this.viewer3D = new Autodesk.Viewing.GuiViewer3D(
    //   document.getElementById('forgeViewer')!,
    //   {
    //     theme: 'light-theme',
    //     profileSettings: {
    //       ambientShadows: true,
    //       reverseMouseZoomDir: true,
    //       edgeRendering: true
    //     },
    //     ambientShadows: true,
    //     disabledExtensions: {
    //       explode: true,
    //       hyperlink: true,
    //       measure: true,
    //       scalarisSimulation: true,
    //       section: true,
    //       viewcube: false,
    //       layermanage: true,
    //       fusionOrbit: true
    //     },
    //     skipPropertyDb: true,
    //     viewerComponent: this
    //   }
    // );
    // var startedCode = this.viewer3D.start();

    Autodesk.Viewing.Initializer(options, function () {
      var htmlDiv = document.getElementById('forgeViewer')!;
      viewer = new Autodesk.Viewing.GuiViewer3D(htmlDiv);
      var startedCode = viewer.start();
      // viewer.displayViewCube( false )
      if (startedCode > 0) {
        console.error('Failed to create a Viewer: WebGL not supported.');
        return;
      }
      console.log('Initialization complete, loading a model next...');
    });
    // var documentId = 'urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6ZHQtcHJvai1idWNrZXQtMS9IUmlzaGFicmFqLUdNQTYzJTIwQ29vcmRpbmF0ZWQubndk'; //gma63
    var documentId = this.urn_name_map['urn']
    Autodesk.Viewing.Document.load(documentId, onDocumentLoadSuccess.bind(this), onDocumentLoadFailure);
    function onDocumentLoadSuccess(viewerDocument: any) {
      var defaultModel = viewerDocument.getRoot().getDefaultGeometry();
      viewer.loadDocumentNode(viewerDocument, defaultModel);

      // let _eventHandlers = {[Autodesk.Viewing.GEOMETRY_LOADED_EVENT]: this.onModelLoaded,
      // [Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT]: this.onObjectTreeLoaded}
      //   for (const evKey in _eventHandlers) {
      //     if (evKey) {
      //       viewer.addEventListener(evKey, _eventHandlers[evKey]);
      //     }
      //   }
    }

    function onDocumentLoadFailure() {
      console.error('Failed fetching Forge manifest');
    }
  }

  private generateUUIDv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  
  async post_full_load() {
    // @ts-ignore
    let _viewer = window["NOP_VIEWER"];
    const instTree: Autodesk.Viewing.InstanceTree = _viewer.model.getInstanceTree();
    const rootId = instTree['getRootId']();
    function buildNodeJson(nodeId: number) {
      const nodeName = instTree['getNodeName'](nodeId);
      const node = {
          forge_id: nodeId,
          name: nodeName,
          children: []
      };
      instTree['enumNodeChildren'](nodeId, (childId) => {
          const childNode = buildNodeJson(childId);
          // @ts-ignore
          node.children.push(childNode);

      });
      return node;
  }
  const modelBrowserJson = buildNodeJson(rootId);
  // @ts-ignore
  var _eq_post_arr = []
  
  _viewer.model.getObjectTree((tree: { enumNodeChildren: (arg0: any, arg1: (dbId: any) => void, arg2: boolean) => void; getRootId: () => any; }) => {
    const allDbIds: number[] = [];
    tree.enumNodeChildren(tree.getRootId(), (dbId: number) => {
        allDbIds.push(dbId);
    }, true);

    var floors = {}

    var unique_category = new Set()
    var unique_types = new Set()

    // Bulk fetch properties for all dbIds
    _viewer.model.getBulkProperties(allDbIds, ['DT Category', 'DT System', 'DT Level', 'DT Zone', 'name'], async (results: any[]) => {
        results.forEach((item: { properties: any[]; dbId: string | number; }) => {
            const properties: { dtc?: any; dts?: any ; dtl?:any; dtz?:any; name?:any} = {};
            item.properties.forEach((p: { displayName: string; displayValue: any; }) => {
                if (p.displayName === "DT Category") {
                  properties.dtc = p.displayValue
                  unique_category.add(p.displayValue)
                };
                if (p.displayName === "DT System") {
                  properties.dts = p.displayValue
                  // @ts-ignore
                  properties.name = item.name;
                  unique_types.add(p.displayValue)
                };
                if (p.displayName === "DT Zone") properties.dtz = p.displayValue;
                if (p.displayName === "DT Level") {
                  properties.dtl = p.displayValue;
                  if (!floors.hasOwnProperty(p.displayValue)){
                    // @ts-ignore
                    floors[p.displayValue] = item.dbId
                  }
                }

            });

            // Store only dbIds where at least one property is found
            if (properties.dtc !== undefined || properties.dts !== undefined|| properties.dtl !== undefined) {
              // @ts-ignore
                this.propertyData[item.dbId] = properties;
            }
        });

        
        // console.log("Filtered Properties:", db_data);

        let _httpOptions = {
          headers: new HttpHeaders({
            accept: `text/plain`,
            'Content-Type': 'application/json',
    
          })
        };
        let body = {
          "username": "saurabh87",
          "password": "Saurabh@87"
        }
        let _resp: any;
        _resp = await this.httpClient.post("https://pce-dt-api.azurewebsites.net/Auth/login", JSON.stringify(body), _httpOptions).toPromise();
        console.log(_resp);
        let _token = _resp.token



        var db_data = {
          'region': 'Maharashtra',
          'portfolio_id': 1,
          'location_id': 'bb6e66dc-22c8-44c5-bcea-3aa10a1fe705',
          'building_name': this.urn_name_map['name'],
          // 'building_name': 'GMA63-V2',
          'building_urn': _viewer.model.getData().urn,
          'building_address': 'Goregaon',
          'building_city': 'Mumbai',
          'floors': floors,
          'equipment': this.propertyData
        }

                 
          let headers = new HttpHeaders({
            'Authorization': `Bearer ${_token}`,
            'Content-Type': 'application/json'
            
          })


        body = {
          // @ts-ignore
          "name": db_data.building_name,
          // @ts-ignore
          "address": db_data.building_address,
          // @ts-ignore
          "city": db_data.building_city,
          // @ts-ignore
          "country": db_data.building_urn,
          "geog": {
            "x": 0,
            "y": 0
          },
          "isDeleted": false,
          // @ts-ignore
          "locationId": db_data.location_id,
          "hasWing": false
        }
        
        _resp = await this.httpClient.post("https://pce-dt-api.azurewebsites.net/Building/SaveBuilding", JSON.stringify(body), {headers, responseType: 'text'}).pipe(take(1)).subscribe(async value => {
        let building_id = value;


        let floor_name_floor_id_map = {};
        Object.keys(db_data.floors).forEach(async (floor_name) => {
          // console.log(floor_name)
          body = {
            // @ts-ignore
              "name": floor_name,
              "hasZone": false,
              "hasRoom": true,
              "buildingId": building_id,
              "wingId": null
            }

            let _floor_id = await firstValueFrom(this.httpClient.post("https://pce-dt-api.azurewebsites.net/Floor/SaveFloor", JSON.stringify(body), {headers, responseType: 'text'}));
            // @ts-ignore
            floor_name_floor_id_map[floor_name] = _floor_id;
          // debugger;
          })

          let category_id_map = {};
          unique_category.forEach(async (category_name) => {
            body = {
              // @ts-ignore
              "name": category_name,
              "portfolioId": db_data.portfolio_id,
              "isDeleted": false
            }
            let category_id = await firstValueFrom(this.httpClient.post("https://pce-dt-api.azurewebsites.net/EquipmentCategory/SaveEquipmentCategory", JSON.stringify(body), {headers, responseType: 'text'}));
            // @ts-ignore
            category_id_map[category_name] = category_id;

          })


          let _eq_system_id = {};

          
          let _eq_display_name_map = {}


          let _eq_name_counter = {}



          for (const forge_id of Object.keys(db_data.equipment)) {
            let _forge_id = Number(forge_id)
            // @ts-ignore
            let _eq = db_data.equipment[_forge_id]
            


            if ('dts' in _eq && 'dtc' in _eq && 'dtl' in _eq) {
              if (Object.keys(_eq_system_id).includes(_eq['dts'])) {
                console.log(Object.keys(_eq_system_id))
              } else {
                body = {
                  // @ts-ignore
                  "name": _eq['dts'],
                  // @ts-ignore
                  "equipmentCategoryId": category_id_map[_eq['dtc']],
                  "isDeleted": false
                }
                let _system_id = await lastValueFrom(this.httpClient.post("https://pce-dt-api.azurewebsites.net/EquipmentType/SaveEquipmentType", JSON.stringify(body), {headers, responseType: 'text'}));
                // @ts-ignore
                _eq_system_id[_eq['dts']] = _system_id;
              }
                // let _system_id = await this.httpClient.post("https://pce-dt-api.azurewebsites.net/EquipmentType/SaveEquipmentType", JSON.stringify(body), {headers, responseType: 'text'}).pipe(take(1)).subscribe(async value => {
                  // @ts-ignore
                  // _eq_system_id[_eq['dts']] = value;
                // })              

              let display_name_fqdr = `${_eq['name']}-${_eq['dts']}-${_eq['dtc']}`

              if (display_name_fqdr in Object.keys(_eq_display_name_map)) {
                // @ts-ignore
                _eq_display_name_map[display_name_fqdr] = _eq_display_name_map[display_name_fqdr]++
              } else {
                // @ts-ignore
                _eq_display_name_map[display_name_fqdr] = 1
              }

              
              // let display_name_fqdr = `${_eq['name']}-${_eq['dts']}-${_eq['dtc']}`

              if (Object.keys(_eq_name_counter).includes(_eq['name'])) {
                // @ts-ignore
                _eq_name_counter[_eq['name']] = _eq_name_counter[_eq['name']] + 1
              } else {
                // @ts-ignore
                _eq_name_counter[_eq['name']] = 1
              }
              let _eq_obj = {
                'id': this.generateUUIDv4(),
                'name': `${_eq['name']}~!@#${_forge_id}`,
                // @ts-ignore
                'displayName': `${_eq['name']} - ${_eq_name_counter[_eq['name']]}`,
                // @ts-ignore
                'floorId': floor_name_floor_id_map[_eq['dtl']],
                'buldingId': building_id,
                "wingId": null,
                "zoneId": null,
                "roomId": null,
                // @ts-ignore
                "equipmentTypeId": _eq_system_id[_eq['dts']],
                // @ts-ignore
                "equipmentCategoryId": category_id_map[_eq['dtc']],
                "isDeleted": false,
                // 'forge_id': _forge_id
              }

              _eq_post_arr.push(_eq_obj)
              // console.log(_eq_obj['displayName'])


            }
            
          }
          // @ts-ignore
          let _eq_resp = await lastValueFrom(this.httpClient.post("https://pce-dt-api.azurewebsites.net/Equipment/SaveEquipments", JSON.stringify(_eq_post_arr), {headers, responseType: 'text'}));
          console.log(_eq_resp)
          debugger        
      
      
        
       })
        ;
        // debugger
    }, (error: any) => {
        console.error("Error fetching bulk properties:", error);
    });
});
console.log(JSON.stringify(modelBrowserJson)) 

// console.log(JSON.stringify(this.final_data))
}
  propertyData = {};
}
