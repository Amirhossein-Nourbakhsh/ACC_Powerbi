
"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";
import DataView = powerbi.DataView;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

// import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
// import DataViewTable = powerbi.DataViewTable;
// import DataViewTableRow = powerbi.DataViewTableRow;
// import PrimitiveValue = powerbi.PrimitiveValue;

import { VisualFormattingSettingsModel } from "./settings";
import { writeFileSync} from 'fs';
import { resolve } from "path";

var packagejs = require('../package.json');

export class Visual implements IVisual {
    private target: HTMLElement;
    private updateCount: number;
    private textNode: Text;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private table_dbid: HTMLParagraphElement;

    private  DOCUMENT_URN: string = 'urn:dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLk5zdlZndTNsUllHVjNlRlpIYnp5Umc_dmVyc2lvbj0y';
                                        
    private MY_SERVER_ENDPOINT = 'token'; //TOKEN endpoint to get access token
    private pbioptions:VisualConstructorOptions;
    private ACCESS_TOKEN: string = null; 
    private forge_viewer: Autodesk.Viewing.GuiViewer3D=null;

    private isModelLoaded: boolean = false;

    private  leaves_2: any;

    private dbIds: number[] = [];
    private colorCodes: number[] = [];
    private viewerInitialized: boolean = false;

    private forgeviewerjs;

    
    
    constructor(options: VisualConstructorOptions) {
        // Clear the existing viewer
       // this.forge_viewer.finish();
        //this.forge_viewer = null; // Clear the viewer instance
      
        

        console.log('Visual constructor', options);
        this.viewerInitialized = false;
        this.isModelLoaded = false;
        
        this.formattingSettingsService = new FormattingSettingsService();
       
        //this.updateCount = 0;
       

        this.pbioptions = options; 
        this.target = options.element;

        // Create the div element
        const forgeViewerDiv = document.createElement('div');
        forgeViewerDiv.id = 'forge-viewer';
        // Append the div to the target element
        this.target.appendChild(forgeViewerDiv);

        

        //if(!document.getElementById('myrefreshbutton')){
            const refreshbutton =  document.createElement('button');
            refreshbutton.id = "myrefreshbutton";
            refreshbutton.innerText = "Refresh Viewer";
            refreshbutton.addEventListener('click', ()=> this.refreshViewer());
            this.target.appendChild(refreshbutton);
        //}


        /*if(!this.forge_viewer){
            this.getToken2();
            return;
        }*/
        //this.target.innerHTML = '<div id="forge-viewer" ></div>';

        // this.table_dbid = document.createElement("table");
        // this.target.appendChild(this.table_dbid);
        
        
        // Here I need to read urn
        //console.log("######first urn line 66" + packagejs.urn);
        //this.DOCUMENT_URN =  packagejs.urn;
       /* if (document) {
            //unload the viewer

         
            
            if(this.ACCESS_TOKEN != null){
                //hard-coded token, load the model directly
                this.initializeViewer("forge-viewer");  
            }else{
                //this.getToken(this.MY_SERVER_ENDPOINT); 
                this.getToken2(); 
                //inside getToken callback, will load the model
            }
                //this.getToken2(); 
        }*/

               // if (typeof document !== "undefined") {
                    //unload the viewer
                   
                    
                    
               // }
               

                if (typeof document !== "undefined"){
                    console.log("inside typeof document !== undefined");
                    this.getToken2();
                    if(this.ACCESS_TOKEN != null){
                        console.log("@@@@@@model is updated from constructor");
                        //hard-coded token, load the model directly
                        //this.initializeViewer("forge-viewer");  
                    }else{
                        //this.getToken2(); 
                        //inside getToken callback, will load the model
                    }
                }

    }


    private refreshViewer(): void {
        const allModels = this.forge_viewer?.getAllModels();
        if(allModels && allModels.length >0){
            allModels.forEach(model => this.forge_viewer.unloadModel(model));
        }
        this.loadModelWithURN(this.DOCUMENT_URN);
    }

    private loadModelWithURN(urn:string): void {
        if(!this.forge_viewer){
            console.log("Viewer instance is not initialized");
            this.initializeViewer("forge-viewer");
           // this.forge_viewer = new Autodesk.Viewing.GuiViewer3D(viewerContainer);
            //this.forge_viewer.start();
            
            return;
        }

        Autodesk.Viewing.Document.load(urn, (doc)=>{
            const viewable = doc.getRoot().getDefaultGeometry();

            this.forge_viewer.loadDocumentNode(doc, viewable, {}).then(()=> {
                console.log("model loaded successfully");
            }).catch((err)=> {
                console.error("error loading model node", err);
            });
        }, 
            (errorCode) => {
                console.error("Error loading document:", errorCode);
            }
        );
    }



    private async getToken2(): Promise<void> {
        const url = 'https://developer.api.autodesk.com/authentication/v2/token';
        const clientId = '';
        const clientSecret = '';
        const basicAuth = btoa(`${clientId}:${clientSecret}`);
        const bodyParams = new URLSearchParams({
            'grant_type': 'client_credentials',
            'scope': 'bucket:create bucket:read data:create data:write data:read'
        });
    
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'Authorization': `Basic ${basicAuth}`
                },
                body: bodyParams
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const data = await response.json();
            this.ACCESS_TOKEN = data.access_token;
            console.log('Access Token = ' + this.ACCESS_TOKEN);
            this.initializeViewer("forge-viewer");
        } catch (error) {
            console.error('Error fetching access token:', error);
        }
    }
    


    private async initializeViewer(placeHolderDOMid: string): Promise<void> {

       /* if (this.viewerInitialized) {
            console.log('###Viewer is already initialized. Skipping initialization.');
            return; // Prevent reinitialization
        }*/

        //this.clearViewer();
        const viewerContainer = document.getElementById(placeHolderDOMid)
        //load Forge Viewer scripts js and style css
        
        await this.loadForgeViewerScriptAndStyle();

        const options = {
            env: 'AutodeskProduction',
            accessToken: this.ACCESS_TOKEN
        }

        console.log("###DOCUMENT_URN in initializeViewer=",this.DOCUMENT_URN );
        var documentId = this.DOCUMENT_URN;
        
        
       

        //debugger;

        Autodesk.Viewing.Initializer(options, () => {
            this.forge_viewer = new Autodesk.Viewing.GuiViewer3D(viewerContainer);
            this.forge_viewer.start();

            console.log("@@@@models=", this.forge_viewer.getAllModels());
            Autodesk.Viewing.Document.load(documentId, (doc)=>{
                //if specific viewerable, provide its guid
                //otherwise, load the default view
                var viewableId = undefined 
                var viewables:Autodesk.Viewing.BubbleNode = (viewableId ? doc.getRoot().findByGuid(viewableId) : doc.getRoot().getDefaultGeometry());
                this.forge_viewer.loadDocumentNode(doc, viewables, {}).then(i => {
                  console.log('document has been loaded');
                   
                  this.forge_viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT,res=>{
                    //GEOMETRY_LOADED_EVENT
                    console.log('GEOMETRY_LOADED_EVENT triggered!');
                    console.log('dumpping dbIds...');
                    console.log("@@@@models=", this.forge_viewer.getAllModels());
                    
                    const allModels = this.forge_viewer.getAllModels();
                    if(allModels.length > 1){
                        const modelToKeep = allModels[0];
                        for(let i=1; i<allModels.length;i++){
                            this.forge_viewer.unloadModel(allModels[i]);
                        }
                    }

                    this.viewerInitialized = true;
                    if (this.viewerInitialized) {
                        this.setColorBasedOnStatus();
                    }      
                    this.forge_viewer.model.getExternalIdMapping(data => {
                        //console.log("@@@@@@@String externalID"+JSON.stringify(data));
                        //console.log("@@@ Keys in the externalID" + Object.keys(data));
                        
                    }      
                         , this.onFail);
                  

                    this.forge_viewer.getObjectTree( tree => {

                   }); 
                });

                  this.forge_viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT,res=>{

                    console.log("@@@@inside add Event Listener SELECTION_CHANGED_EVENT");
                    
                   
                    //Investigation on how to update PowerBI Visual when objects are selected in Forge Viewer
                  var selection = this.forge_viewer.getSelection();
                  this.forge_viewer.fitToView( selection );

                  this.isModelLoaded = true;

                  

                    if (res.dbIdArray.length ===1 ) { 
                      
                    this.forge_viewer.showAll();
                       
                    this.forge_viewer.isolate(this.dbIds);
                        
                        //this.selectionMgr.select()

                        
                    }
                  });
                         
                });

            }, (err)=>{
                console.error('onDocumentLoadFailure() - errorCode:' + err); 
                if (this.forge_viewer) {
                    console.log('###3Options', options);
                    console.log("###this.isModelLoaded", this.isModelLoaded);
                   
        //this.dbIds = dataView.table.rows.map(r => <number>r[0].valueOf());
        //this.colorCodes = dataView.table.rows.map(r => <number>r[2].valueOf());

        /*if(dataView.table.rows[0][1] != ""){
            var new_urn =  "urn:" + dataView.table.rows[0][1];
            console.log('@@@@@urn=' + new_urn);
        }
                    this.forge_viewer.finish();
                    this.getToken2();*/
                    //this.initializeViewer("forge-viewer"); // Dispose of the old viewer
                }
                

            });

            
          });

     

    }


    private async loadForgeViewerScriptAndStyle(): Promise<void> {
        return new Promise<void>((reslove,reject) => {
            console.log("insilde loadForgeViewerScriptAndStyle");

          // if(!document.getElementById('forgeviewerjs')){
          // if(this.isModelLoaded){
          if(this.forge_viewer){
            console.log("insilde the forgeviewerjs check", this.forge_viewer.getAllModels().length);

          }

            this.forgeviewerjs = document.createElement('script');
            this.forgeviewerjs.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/viewer3D.js';
            this.forgeviewerjs.id = 'forgeviewerjs';
            document.body.appendChild(this.forgeviewerjs);

                //resolve();
                //return;
            

            
            this.forgeviewerjs.onload = () => {
                console.info("Viewer scripts loaded"); 
                let link = document.createElement("link");
                link.rel = 'stylesheet';
                link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/style.min.css';
                link.type = 'text/css';
                link.id = "forgeviewercss";
                document.body.appendChild(link); 
                console.info("###########Viewer CSS loaded"); 
                reslove();
            };


            this.forgeviewerjs.onerror = (err) => {
                console.info("Viewer scripts error:" +err ); 
                reject(err);
            }; 

       // }

        });

        
       

    };

    public onFail(){
        console.log('in the fail function');
    }

    public onSuc(datatest){
        console.log('in the suc function' + datatest);
       
    }


    public update(options: VisualUpdateOptions) {

        let refreshbutton = document.getElementById('myrefreshbutton') as HTMLButtonElement;

        if(!refreshbutton){

            refreshbutton =  document.createElement('button');
            refreshbutton.id = "myrefreshbutton";
            refreshbutton.innerText = "Refresh Viewer";
            refreshbutton.addEventListener('click', ()=> this.refreshViewer());
            this.target.appendChild(refreshbutton);
            
        }

        console.log("First line of update function");
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews);
        //this.target.innerHTML = `<p>Up`
        console.log('Visual update', options);
        const dataView: DataView = options.dataViews[0];
        //this.dbIds = dataView.table.rows.map(r => <number>r[0].valueOf());
        //this.colorCodes = dataView.table.rows.map(r => <number>r[2].valueOf());

        if(dataView.table.rows[0][1] != ""){
            var new_urn =  "urn:" + dataView.table.rows[0][1];
            console.log('@@@@@urn=' + new_urn);
        }


        if(!document.getElementById('forgeviewerjs')){
             this.loadForgeViewerScriptAndStyle();
        }


        
        if(this.DOCUMENT_URN != new_urn){
            
            console.log("@@@@@@### urn changed and we need to update the view");
           
            this.DOCUMENT_URN = new_urn;
            if(!this.isModelLoaded && !this.viewerInitialized){
                this.getToken2();
            }
             //this.getToken2();
        }else{
            console.log("@@@@@ urn did not change");
            if(!this.isModelLoaded && !this.viewerInitialized){
                //this.initializeViewer("forge-viewer");
            }
           
        }

        

       
        

      //  if(!this.viewerInitialized){
            
            //console.log("@@@@@@### urn changed and we need to update the view");
           
            
           // this.clearViewer();
            /*if(!this.forge_viewer){
                this.getToken2();
                return;
            }*/
             
       // }else{
            //console.log("@@@@@ urn did not change");
            
       // }

        console.log('number of dbid selected=' + dataView.table.rows.length);
        
        //this.forge_viewer.isolate(dbid_test);
         
        this.dbIds = dataView.table.rows.map(r => 
            <number>r[0].valueOf());

        //const colorCodes = dataView.table.rows.map(r => <number>r[2].valueOf());
        const colorCodes = dataView.table.rows.map(r => {
            const value = r[2].valueOf();
            // Ensure the value is a number or convert it to a number
            return typeof value === 'number' ? value : parseInt(String(value), 10);
        });
        //this.colorCodes = colorCodes;
        
        this.forge_viewer.showAll();
         //this.forge_viewer.impl.setGhostingBrightness(true); //for isolate effect 
         this.forge_viewer.isolate(this.dbIds);
         var selection = this.forge_viewer.getSelection();
         this.forge_viewer.fitToView( selection );

         // Color coding
         // Retrieve the "color_codes" data
         if (this.viewerInitialized) {
            this.setColorBasedOnStatus();
        }
         
         //this.forge_viewer.isolate(this.leaves_2);
         


       
    
    }


    private setColorBasedOnStatus() {
        console.log("######SET COLOR##########");
        const colors = [
            new THREE.Vector4(0.5, 0.5, 0.5, 1), // Gray
            new THREE.Vector4(1, 1, 0, 1), // Yellow
            new THREE.Vector4(0, 1, 0, 1), // Green
            new THREE.Vector4(1, 0, 0, 1), // Red
            new THREE.Vector4(0, 0, 1, 1) // Blue

        ];

        /*for (let index = 0; index < this.dbIds.length; index++) {
           // console.log("###ColorCode###", this.colorCodes[index]);
            let selectedColor = colors[4];
            if (this.colorCodes[index] == 0) {
                selectedColor = colors[1];
            } else if (this.colorCodes[index] == 1) {
                selectedColor = colors[2];
            } else if (this.colorCodes[index] == 2) {
                selectedColor = colors[3];
            } else {selectedColor = colors[4];}
            this.forge_viewer.setThemingColor(this.dbIds[index], selectedColor);
        }*/
    }




    private getData(options: VisualUpdateOptions) {
        // Logic to extract and format data
    }
    

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property. 
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}