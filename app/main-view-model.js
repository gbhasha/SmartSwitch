const Observable = require("tns-core-modules/data/observable").Observable;
const connectivityModule = require("tns-core-modules/connectivity");
const application = require("tns-core-modules/application");
const dialogs = require("tns-core-modules/ui/dialogs");
const httpModule = require("http");

const config = require("./config.js").config

const onImgUrl = "~/images/light-on.jpg";
const offImgUrl = "~/images/light-off.jpg";
const viewModel = new Observable();

application.on(application.resumeEvent, () => {
    console.log('Perform App Foreground Checks...')
    getSwitchStatus();
});

function showNoInternetAlert() {
    dialogs.alert({
        title: "No Internet Connection",
        message: "Please check your internet connection or try again",
        okButtonText: "RETRY"
    }).then(function () {
        if(connectivityModule.getConnectionType() === 0) {
            showNoInternetAlert()
        }
    });
}
function showAlert(msg="Something went wrong") {
    dialogs.alert({
        title: "Something went wrong",
        message: msg,
        okButtonText: "Okay"
    }).then(function () {
        return false;
    });
}

function updateSwitchState() {
    httpModule.request({
        url: config.baseAPI + config.updateSwitch,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        content: JSON.stringify({
            status: !viewModel.get("isOn"),
            switchID: config.switchID
        })
    }).then((response) => {
        const respContent = response.content.toJSON();
        const statusCode = response.statusCode;
        if(statusCode === 200) {
            viewModel.set("isOn", !viewModel.isOn);
            viewModel.set("bgImg", viewModel.isOn ? onImgUrl : offImgUrl);
            viewModel.set("connectionMessage", connectionMessage())
        } else {
            showAlert('response Content : ', JSON.stringify(respContent));
        }

    }, (e) => {
        showAlert(e.toString());
    });
}

function getSwitchStatus() {
    // Hit Another API for checking the lightStatus at server
    httpModule.request({
        url: config.baseAPI + config.switchStatus +"?switchID="+config.switchID,
        method: "GET"
    }).then((response) => {
        const respContent = response.content.toJSON();
        const statusCode = response.statusCode;

        console.log('getSwitchStatus : ', JSON.stringify(respContent))

        if(statusCode === 200 && respContent) {
            const lightStatus = respContent.Item.status || false
            viewModel.set("isOn", lightStatus);
            viewModel.set("bgImg", viewModel.isOn ? onImgUrl : offImgUrl);
            viewModel.set("connectionMessage", connectionMessage())
        } else {
            showAlert('respContent : ', respContent.statusCode);
        }

    }, (e) => {
        showAlert(e.toString());
    });
}

function connectionMessage() {
    return `Switch is ${viewModel.isOn ? 'ON' : 'OFF'}`
}

function mainViewModel() {

    const connectionType = connectivityModule.getConnectionType();


    viewModel.isConnected = !!connectionType;
    viewModel.bgImg = offImgUrl;
    viewModel.isOn = false;

    viewModel.connectionMessage = connectionMessage()

    viewModel.onTap = () => {
        viewModel.set("connectionMessage", "Update in progress...")
        updateSwitchState();
    };

    connectivityModule.startMonitoring((newConnectionType) => {
        console.log('started monitoring...');
        const isConnected = !!newConnectionType;
        viewModel.set("isConnected", isConnected);

        if(!isConnected) {
            showNoInternetAlert()
        } else {
            getSwitchStatus()
        }
    });

    return viewModel;
}

exports.mainViewModel = mainViewModel;
