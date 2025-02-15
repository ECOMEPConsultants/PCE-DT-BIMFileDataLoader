/// <reference types="forge-viewer" />
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
    debugger
    return _resp;

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
    // var documentId = 'urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6ZHQtcHJvai1idWNrZXQtMS9IUmlzaGFicmFqLUdNQTYzJTIwQ29vcmRpbmF0ZWQubndk';
    var documentId = 'urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6ZHQtcHJvai1idWNrZXQtMS9NYW5nYWwlMjBCdWlsZGhvbWUtTWFsYWQlMjBHYXV0YW1fQ29vcmRpbmF0ZWRfUjQubndk';
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
  
  _viewer.model.getObjectTree((tree: { enumNodeChildren: (arg0: any, arg1: (dbId: any) => void, arg2: boolean) => void; getRootId: () => any; }) => {
    const allDbIds: number[] = [];
    tree.enumNodeChildren(tree.getRootId(), (dbId: number) => {
        allDbIds.push(dbId);
    }, true);

    var floors = {}

    // Bulk fetch properties for all dbIds
    _viewer.model.getBulkProperties(allDbIds, ['DT Category', 'DT System', 'DT Level', 'DT Zone'], (results: any[]) => {
        results.forEach((item: { properties: any[]; dbId: string | number; }) => {
            const properties: { dtc?: any; dts?: any ; dtl?:any; dtz?:any} = {};
            item.properties.forEach((p: { displayName: string; displayValue: any; }) => {
                if (p.displayName === "DT Category") properties.dtc = p.displayValue;
                if (p.displayName === "DT System") properties.dts = p.displayValue;
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

        var db_data = {
          'region': 'Maharashtra',
          'building': 'GMA63',
          'building_urn': _viewer.model.getData().urn,
          'floors': floors,
          'equipment': this.propertyData
        }
        console.log("Filtered Properties:", db_data);
    }, (error: any) => {
        console.error("Error fetching bulk properties:", error);
    });
});
console.log(JSON.stringify(modelBrowserJson)) 

// console.log(JSON.stringify(this.final_data))
}
  propertyData = {};
}
