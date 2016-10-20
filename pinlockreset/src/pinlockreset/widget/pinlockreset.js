/*global logger*/
/*
    pinlockreset
    ========================

    @file      : pinlockreset.js
    @version   : 1
    @author    : Simon Martyr (@vintage_si)
    @date      : Thu, 08 Sep 2016 11:37:32 GMT
    @copyright : 
    @license   : 

    Documentation
    ========================
    App can only be used in cordova app.
    The app makes use of Cordova plugin 
    Secure Store. 
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",

    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/on",
    "dojo/touch",
    "dojo/dom-attr",
    "dojo/query",
    "dojo/html",
    "dojo/_base/event",

    "dojo/text!pinlockreset/widget/template/pinlockreset.html"
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, dojoLang, dojoText, dojoOn, dojoTouch, dojoDomAttr, dojoQuery, dojoHtml, dojoEvent, widgetTemplate) {
    "use strict";


    // Declare widget's prototype.
    return declare("pinlockreset.widget.pinlockreset", [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // DOM elements
        inputNodes: null,
        input1: null, 
        input2: null,
        input3: null,
        input4: null, 
        input5: null, 
        commandText: null, 
        infoTextNode: null,
        del: null, 

        // Parameters configured in the Modeler.
        appId: null, 
        mfOnFinish: null,
        mfOnFailure: null, 
        limit: null, 
        banList: null, 
        
        //internal vars
        _store: null,
        _currentInput: "",
        _pinLocation: 'pin', //default location
        _pinToCheck: null, 
        _lockStateEnum: {READY : 0, CHANGE : 1, CONFIRM : 2},
        _lockState: null,
        _failCount: 0,

        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function () {
            logger.debug(this.id + ".constructor");
        },

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function () {
            logger.debug(this.id + ".postCreate");
            this._lockState = this._lockStateEnum.READY; //default state
            var storeId = this.appId; 
            
            //use appId to find the store location on the device. 
            try{
                this._store = new cordova.plugins.SecureStorage(
                    function () { console.log('Success')},
                    function (error) { console.log('Error ' + error); },
                    storeId);
            }
            catch(err){
                console.log(err.message); //most likely addon or cordova failed 
                return;
            }
            this._events();

        },



        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function () {
          logger.debug(this.id + ".uninitialize");
        },
        
        _stopBubblingEventOnMobile: function (e) {
            logger.debug(this.id + "._stopBubblingEventOnMobile");
            if (typeof document.ontouchstart !== "undefined") {
                dojoEvent.stop(e);
            }
        },
        
        _events: function () {
            
            var nl = dojoQuery(".numButtons", this.inputNodes); //get all the num buttons within this domnode
            
            dojoOn(nl, dojoTouch.press, dojoLang.hitch(this,function(e){
                this._stopBubblingEventOnMobile(e); 
                this._numberButtonPress(e.currentTarget.value);
            }));
            
            dojoOn(this.del, dojoTouch.press, dojoLang.hitch(this, function(e){
                this._stopBubblingEventOnMobile(e);
                this._removeLastDigit(); 
            }));
            
            
        },
        
        _removeLastDigit: function(){
            this._currentInput = this._currentInput.slice(0,-1); //remove last char from string - this is fine as well if empty.   
            this._inputState(); //update ui.  
        },
        
        _numberButtonPress: function(number){
            if(!/^[0-9]{1}/.test(number)){
                return; //prevent any strange values. 
            }
            this._currentInput = this._currentInput + number; 
            this._verifyInput(); 
        },
        
        _verifyInput : function(){
            this._inputState(); //update ui.
            
            if(this._currentInput.length === 5){
                switch(this._lockState){
                    case this._lockStateEnum.READY:
                        //check pin before allowing change
                        this._checkPin(); 
                        break;
                    case this._lockStateEnum.CHANGE:
                        // temp store new key.
                        this._changePin(); 
                        break;
                    case this._lockStateEnum.CONFIRM:
                        //check new key matches with confirmation.
                        this._confirmPin(); 
                        break; 
                }
                this._resetInput(); 
            }
                       
        },
        
        _inputState : function(){
            switch(this._currentInput.length){
                case 1:
                    dojoDomAttr.set(this.input1, "value", "*");
                    dojoDomAttr.set(this.input2, "value", "");
                    dojoDomAttr.set(this.input3, "value", "");
                    dojoDomAttr.set(this.input4, "value", "");
                    dojoDomAttr.set(this.input5, "value", "");
                    break;
                case 2:
                    dojoDomAttr.set(this.input1, "value", "*");
                    dojoDomAttr.set(this.input2, "value", "*");
                    dojoDomAttr.set(this.input3, "value", "");
                    dojoDomAttr.set(this.input4, "value", "");
                    dojoDomAttr.set(this.input5, "value", "");
                    break;
                case 3:
                    dojoDomAttr.set(this.input1, "value", "*");
                    dojoDomAttr.set(this.input2, "value", "*");
                    dojoDomAttr.set(this.input3, "value", "*");
                    dojoDomAttr.set(this.input4, "value", "");
                    dojoDomAttr.set(this.input5, "value", "");
                    break;
                case 4:
                    dojoDomAttr.set(this.input1, "value", "*");
                    dojoDomAttr.set(this.input2, "value", "*");
                    dojoDomAttr.set(this.input3, "value", "*");
                    dojoDomAttr.set(this.input4, "value", "*");
                    dojoDomAttr.set(this.input5, "value", "");
                    break;
                case 5:
                    dojoDomAttr.set(this.input1, "value", "*");
                    dojoDomAttr.set(this.input2, "value", "*");
                    dojoDomAttr.set(this.input3, "value", "*");
                    dojoDomAttr.set(this.input4, "value", "*");
                    dojoDomAttr.set(this.input5, "value", "*");
                    break;
                default:
                    dojoDomAttr.set(this.input1, "value", "");
                    dojoDomAttr.set(this.input2, "value", "");
                    dojoDomAttr.set(this.input3, "value", "");
                    dojoDomAttr.set(this.input4, "value", "");
                    dojoDomAttr.set(this.input5, "value", "");            
            }
        }, 
        
        _checkPin: function(){
            this._verifyPin(this._pinLocation, this._currentInput, dojoLang.hitch(this, function(result){
                if(result){
                    this._failCount = 0; //reset failure count. 
                    dojoHtml.set(this.infoTextNode, "Pincode geverifieerd"); 
                    dojoHtml.set(this.commandText, "Voer nieuwe pincode in");
                    this._lockState = this._lockStateEnum.CHANGE; //update lock state
                }
                else{
                    dojoHtml.set(this.infoTextNode, "Pincode fout"); 
                    dojoHtml.set(this.commandText, "Probeer opnieuw de pincode in te voeren");
                    this._failCount++; 
                    //TODO add the text to inform about failure limit etc. 
                    if(this._failCount >= this.limit){
                        //call failure action
                        mx.data.action({
                            params: {
                                actionname: this.mfOnFailure
                            },
                            callback: function(obj) {
                                //should be empty.. 
                                logger.debug("new pin successful.");
                            },
                            error: function(error) {
                                logger.debug(error);
                            }
                        });
                    }
                }
            }));
        },
        
        _changePin: function(){    
            if(this._checkBanList(this._currentInput)){
                dojoHtml.set(this.infoTextNode, "Pincode te makkelijk, probeer opnieuw"); 
                dojoHtml.set(this.commandText, "Voer uw nieuwe pincode in");
            }
            else{
                this._pinToCheck = this._currentInput;  
                this._lockState = this._lockStateEnum.CONFIRM; 
                dojoHtml.set(this.infoTextNode, "Bevestig pincode"); 
                dojoHtml.set(this.commandText, "Voer uw nieuwe pincode in");
            }

        },
        
        _confirmPin: function(){
            if(this._pinToCheck === this._currentInput){ //new pin successful 
                this._setPin(this._pinLocation, this._currentInput); //set the new pin
                this._lockState = this._lockStateEnum.READY;
                dojoHtml.set(this.infoTextNode, "Pincode is gewijzigd"); 
                dojoHtml.set(this.commandText, "Voer uw huidige pincode in");
                //call success MF
                mx.data.action({
                    params: {
                        actionname: this.mfOnFinish
                    },
                    callback: function(obj) {
                        //should be empty.. 
                        logger.debug("new pin successful.");
                    },
                    error: function(error) {
                        logger.debug(error);
                    }
                });
            }
            else{ //pins didn't match
                this._lockState = this._lockStateEnum.CHANGE; 
                dojoHtml.set(this.infoTextNode, "Pincode kwam niet overeen"); 
                dojoHtml.set(this.commandText, "Voer uw pincode in");
            }
            this._pinToCheck = ""; 
        },
        
        _checkBanList : function(value){
            for(var obj in this.banlist){
                if(this.banlist[obj].pin === value){
                    return true; 
                }
            }
            return false; 
        }, 
        
        _resetInput : function(){
            this._currentInput = ""; 
        },
        
        _removePin: function(key) {
            this._store.remove(
                function(key){ console.log('Removed ' + key); },
                function(error){ console.log('Error ' + error); },
                key);   
        },
        
        _setPin: function(key, value){
            this._store.set(
                function(value){ console.log('new key stored');},
                function(error){ console.log('error' + error);},
                key, value); 
        },
        
        _verifyPin: function(key, check, callback){
            this._store.get(
                function(value){ console.log('verified'); callback(value === check)},
                function(error){ console.log('error' + error);},
                key);
            
        }


    });
});

require(["pinlockreset/widget/pinlockreset"]);
