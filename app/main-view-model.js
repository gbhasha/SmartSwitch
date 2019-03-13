const Observable = require("tns-core-modules/data/observable").Observable;
const connectivityModule = require("tns-core-modules/connectivity");
const application = require("tns-core-modules/application");
const httpModule = require("tns-core-modules/http");
const dialogs = require("tns-core-modules/ui/dialogs");

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
            status: !viewModel.get("isSwitchOn"),
            switchID: config.switchID
        })
    }).then((response) => {
        const respContent = response.content.toJSON();
        const statusCode = response.statusCode;

        console.log('updateSwitchState : ', JSON.stringify(respContent))

        if(statusCode === 200) {
            viewModel.set("isSwitchOn", !viewModel.isSwitchOn);
            viewModel.set("bgImg", viewModel.isSwitchOn ? onImgUrl : offImgUrl);
            viewModel.set("connectionMessage", connectionMessage())
            viewModel.set("isLoading", false)
        } else {
            showAlert('statusCode : ', statusCode);
        }

    }, (e) => {
        showAlert('Exception : '+e.toString());
    });
}

function getSwitchStatus() {
    httpModule.request({
        url: config.baseAPI + config.switchStatus +"?switchID="+config.switchID,
        method: "GET"
    }).then((response) => {
        const respContent = response.content.toJSON();
        const statusCode = response.statusCode;

        console.log('getSwitchStatus : ', JSON.stringify(respContent))

        if(statusCode === 200 && respContent) {
            const lightStatus = respContent.Item.status || false
            viewModel.set("isSwitchOn", lightStatus);
            viewModel.set("bgImg", viewModel.isSwitchOn ? onImgUrl : offImgUrl);
            viewModel.set("connectionMessage", connectionMessage())
            viewModel.set("isLoading", false)

        } else {
            showAlert('statusCode : ', statusCode);
        }

    }, (e) => {
        showAlert('Exception : '+e.toString());
    });
}

function connectionMessage() {
    return `Switch is ${viewModel.isSwitchOn ? 'ON' : 'OFF'}`
}

function mainViewModel() {
    const connectionType = connectivityModule.getConnectionType();

    viewModel.isOnline = !!connectionType;
    viewModel.bgImg = offImgUrl;
    viewModel.isSwitchOn = false;
    viewModel.isLoading = false;
    viewModel.connectionMessage = connectionMessage()

    viewModel.onTap = () => {
        viewModel.set("isLoading", true);
        viewModel.set("connectionMessage", "Update in progress...");
        updateSwitchState();
    };

    connectivityModule.startMonitoring((newConnectionType) => {
        console.log('started monitoring...');
        const isOnline = !!newConnectionType;
        viewModel.set("isOnline", isOnline);

        if(!isOnline) {
            showNoInternetAlert()
        } else {
            getSwitchStatus()
        }
    });

    return viewModel;
}

exports.mainViewModel = mainViewModel;
