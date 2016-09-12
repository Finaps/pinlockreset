/*global logger*/
/*
    pinlockrest
    ========================

    @file      : pinlockrest.js
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
    "dojo/html",
    "dojo/_base/event",

    "pinlockrest/lib/jquery-1.11.2",
    "dojo/text!pinlockrest/widget/template/pinlockrest.html"
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, dojoLang, dojoText, dojoHtml, dojoEvent, _jQuery, widgetTemplate) {
    "use strict";

    var $ = _jQuery.noConflict(true);

    // Declare widget's prototype.
    return declare("pinlockrest.widget.pinlockrest", [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // DOM elements
        inputNodes: null,
        button1: null, 
        infoTextNode: null,

        // Parameters configured in the Modeler.
        appId: null, 
        
        _store: null,
        _currentInput: "",
        _pinVerified: false, 
        _pinLocation: 'pin', //default location

        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function () {
            logger.debug(this.id + ".constructor");
        },

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function () {
            logger.debug(this.id + ".postCreate");
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
        
        _events: function () {
            
            this.connect(this.button1, "click", function(e){
                this._numberButtonPress(this.button1.value);
            });
            
            
        },
        
        _numberButtonPress: function(number){
            if(!/^[0-9]{1}/.test(number)){
                return; 
            }
            this._currentInput = this._currentInput + number; 
            this._verifyInput(); 
        },
        
        _verifyInput : function(){
            if(this._currentInput.length === 5){
                if(this._pinVerified){
                    this._setPin(this._pinLocation, this._currentInput);
                    this._pinVerified = false; //reset state. 
                    this._resetInput(); 
                }
                else{
                    this._pinVerified = this._verifyInput(this._pinLocation, this._currentInput); //check if pin is good
                    this._resetInput(); 
                }
            }
        },
        
        _resetInput : function(){
            this._currentInput = ""; 
            //todo reset layout
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
        
        _verifyPin: function(key, check){
            var result = false;
            this._store.get(
                function(value){ console.log('verified'); if(value === check){ result = true; }},
                function(error){ console.log('error' + error);},
                key);
            
            return result; 
        }


    });
});

require(["pinlockrest/widget/pinlockrest"]);
