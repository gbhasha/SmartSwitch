const Observable = require("tns-core-modules/data/observable").Observable;
const connectivityModule = require("tns-core-modules/connectivity");
const dialogs = require("tns-core-modules/ui/dialogs");
const httpModule = require("http");

const onImgUrl = "~/images/light-on.jpg";
const offImgUrl = "~/images/light-off.jpg";
const config = require("./config.js").config

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

function toggleLightState(viewModel) {
    httpModule.request({
        url: config.baseAPI + config.toggleSwitch,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        content: JSON.stringify({
            lightStatus: !viewModel.get("isOn")
        })
    }).then((response) => {
        console.log('POST > http response', response)
        if(response.statusCode === 200) {
            viewModel.set("isOn", !viewModel.isOn);
            viewModel.set("bgImg", viewModel.isOn ? onImgUrl : offImgUrl);
        } else {
            showAlert('response : ', JSON.stringify(response));
        }

    }, (e) => {
        showAlert(e.toString());
    });
}

function checkLightStatus(viewModel) {
    // Hit Another API for checking the lightStatus at server
    httpModule.request({
        url: config.baseAPI + config.switchStatus,
        method: "GET"
    }).then((response) => {

        console.log('GET >> http response', response)

        if(response.statusCode === 200) {
            // If serverResponse for light is ON returns true;
            const lightStatus = response.lightStatus || false
            viewModel.set("isOn", lightStatus);
            viewModel.set("bgImg", viewModel.isOn ? onImgUrl : offImgUrl);
        } else {
            showAlert('response : ', JSON.stringify(response));
        }

    }, (e) => {
        showAlert(e.toString());
    });
}

function createViewModel() {
    console.log('config', config)
    const viewModel = new Observable();
    const connectionType = connectivityModule.getConnectionType();


    viewModel.isConnected = !!connectionType;

    if(viewModel.isConnected) {
        checkLightStatus(viewModel)
    } else {
        viewModel.bgImg = offImgUrl;
        viewModel.isOn = false;
    }


    viewModel.onTap = () => {
        toggleLightState(viewModel);
    };

    connectivityModule.startMonitoring((newConnectionType) => {
        console.log('started monitoring...');
        const isConnected = !!newConnectionType;
        viewModel.set("isConnected", isConnected);
        if(!isConnected) {
            showNoInternetAlert()
        }
    });

    return viewModel;
}

exports.createViewModel = createViewModel;
