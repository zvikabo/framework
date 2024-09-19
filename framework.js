var contactSearchCallback;

window.Framework = {
    config: {
        name: "Ituran.SiebelCRM",
        clientIds: {
            //'mypurecloud.com': '',
            'mypurecloud.ie': 'ITURAN-CLIENT-ID',
            //'mypurecloud.com.au': '',
            //'mypurecloud.jp': '',
            //'mypurecloud.de': ''
        },
        customInteractionAttributes: ['PT_URLPop', 'PT_SearchValue', 'PT_TransferContext'],
        settings: { 
            embedWebRTCByDefault: false, //true, 
            hideWebRTCPopUpOption: false,
            enableCallLogs: true,
            enableTransferContext: true,
            hideCallLogSubject: true,
            hideCallLogContact: false,
            hideCallLogRelation: false,
            searchTargets: ['people', 'queues', 'frameworkcontacts'],
            theme: {
                primary: '#d4cebd',
                text: '#123'
            },

            embeddedInteractionWindow: true,// by default not present, false. 
        }
    },

    initialSetup: function ()
    {// Subscribe PureClode on array of unnamed functions with types: Interaction, UserAction, Notification.
            //each event in send to siebel (parent.postMessage)
        window.PureCloud.subscribe([ 
            {
                type: 'Interaction',
                callback: function (category, interaction)
                {
                    //window.parent.postMessage(JSON.stringify({ type: "interactionSubscription", data: { category: category, interaction: interaction } }), "*");
                    let ips = window.parent./*???*/SiebelApp.S_App.NewPropertySet();
                    ips.SetProperty("ObjectType", "OpenUI");
                    ips.SetProperty("ObjectName", "GenesysIframe");
                    ips.SetProperty("FunctionName", "interactionSubscription");
                    ips.SetProperty("MessageContent", `category = ${category}, interaction = ${interaction}`);
                    ips.SetProperty("SkipWriteToTable", "Y");
                    ops = window.parent./*???*/SiebelApp.S_App.GetService("User Log Service").InvokeMethod("WriteToLog", ips);
                    ops = ops.GetChildByType("ResultSet").GetChildByType("LogsList");
                }
            },
            {
                type: 'UserAction',
                callback: function (category, data)
                {
                    window.parent.postMessage(JSON.stringify({ type: "userActionSubscription", data: { category: category, data: data } }), "*");
                }
            },
            {
                type: 'Notification',
                callback: function (category, data)
                {
                    window.parent.postMessage(JSON.stringify({ type: "notificationSubscription", data: { category: category, data: data } }), "*");
                }
            }
        ]);

        //window of CTI window (IFrame)

        //this code called by GUI of iframe. It execute function on PureCloud. Possible to add executing function on siebel?
        /*
        example of Siebel call function:
        let ips = SiebelApp.S_App.NewPropertySet();
            ips.SetProperty("FunctionName", "TestCTI");
            ips.SetProperty("MessageContent", "Hello from Genesys");
            ips.SetProperty("ObjectName", "GenesysIframe");
            ips.SetProperty("ObjectType", "OpenUI");
            ips.SetProperty("SkipWriteToTable", "Y");
            ops = SiebelApp.S_App.GetService("User Log Service").InvokeMethod("WriteToLog", ips);
            ops = ops.GetChildByType("ResultSet").GetChildByType("LogsList");
        */
        window.addEventListener("message", function (event) 
        {
            try
            {
                var message = JSON.parse(event.data);
                if (message)
                {
                    if (message.type == "clickToDial")
                    {
                        window.PureCloud.clickToDial(message.data);
                    } else if (message.type == "addAssociation")
                    {
                        window.PureCloud.addAssociation(message.data);
                    } else if (message.type == "addAttribute")
                    {
                        window.PureCloud.addCustomAttributes(message.data);
                    } else if (message.type == "addTransferContext")
                    {
                        window.PureCloud.addTransferContext(message.data);
                    } else if (message.type == "sendContactSearch")
                    {
                        if (contactSearchCallback)
                        {
                            contactSearchCallback(message.data);
                        }
                    } else if (message.type == "updateUserStatus")
                    {
                        window.PureCloud.User.updateStatus(message.data);
                    } else if (message.type == "updateInteractionState")
                    {
                        window.PureCloud.Interaction.updateState(message.data);
                    } else if (message.type == "setView")
                    {
                        window.PureCloud.User.setView(message.data);
                    } else if (message.type == "updateAudioConfiguration")
                    {
                        window.PureCloud.User.Notification.setAudioConfiguration(message.data);
                    } else if (message.type == "sendCustomNotification")
                    {
                        window.PureCloud.User.Notification.notifyUser(message.data);
                    }
                }
            } catch {
                //ignore if you can not parse the payload into JSON
            }
        });
    },
    screenPop: function (searchString, interaction)
    {
        window.parent.postMessage(JSON.stringify({ type: "screenPop", data: { searchString: searchString, interactionId: interaction } }), "*");
    },
    processCallLog: function (callLog, interaction, eventName, onSuccess, onFailure)
    {
        window.parent.postMessage(JSON.stringify({ type: "processCallLog", data: { callLog: callLog, interactionId: interaction, eventName: eventName } }), "*");
        var success = true;
        if (success)
        {
            onSuccess({
                id: callLog.id || Date.now()
            });
        } else
        {
            onFailure();
        }
    },
    openCallLog: function (callLog, interaction)
    {
        window.parent.postMessage(JSON.stringify({ type: "openCallLog", data: { callLog: callLog, interaction: interaction } }), "*");
    },
    contactSearch: function (searchString, onSuccess, onFailure)
    {
        contactSearchCallback = onSuccess;
        window.parent.postMessage(JSON.stringify({ type: "contactSearch", data: { searchString: searchString } }), "*");
    }
};
