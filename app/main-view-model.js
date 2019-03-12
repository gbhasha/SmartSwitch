const Observable = require("tns-core-modules/data/observable").Observable;
const connectivityModule = require("tns-core-modules/connectivity");
var dialogs = require("tns-core-modules/ui/dialogs");

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

function createViewModel() {
    const viewModel = new Observable();
    const connectionType = connectivityModule.getConnectionType();
    const onImgUrl = "~/images/light-on.jpg";
    const offImgUrl = "~/images/light-off.jpg";

    viewModel.isConnected = !!connectionType;
    viewModel.bgImg = offImgUrl;
    viewModel.isOn = false;

    viewModel.onTap = () => {
        viewModel.set("isOn", !viewModel.isOn);
        viewModel.set("bgImg", viewModel.isOn ? onImgUrl : offImgUrl);
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
