const Observable = require("tns-core-modules/data/observable").Observable;
const connectivityModule = require("tns-core-modules/connectivity");
function getMessage(counter) {
    if (counter <= 0) {
        return "Hoorraaay! You unlocked the NativeScript clicker achievement!";
    } else {
        return `${counter} taps left`;
    }
}
function getConnectivityMessage(myConnectionType) {
    switch (myConnectionType) {
        case connectivityModule.connectionType.none:
            return "No connection";
        case connectivityModule.connectionType.wifi:
            return "WiFi connection";
        case connectivityModule.connectionType.mobile:
            return "Mobile connection";
        case connectivityModule.connectionType.ethernet:
            return "Ethernet connection";
        case connectivityModule.connectionType.bluetooth:
            return "Bluetooth connection";
        default:
            return "Unknown"
    }
}

function createViewModel() {
    const viewModel = new Observable();
    viewModel.counter = 5;
    viewModel.message = getMessage(viewModel.counter);

    const connectionType = connectivityModule.getConnectionType();
    viewModel.isConnected = !!connectionType;
    viewModel.connectivityMessage = getConnectivityMessage(connectionType);

    viewModel.onTap = () => {
        viewModel.counter--;
        viewModel.set("message", getMessage(viewModel.counter));
    };

    const list = [];
    for (let i = 0; i < 15; i++) {
        list.push(new Date());
    }


    connectivityModule.startMonitoring((newConnectionType) => {
        console.log('started Monitoring...')
        viewModel.set("isConnected", !!newConnectionType);
        viewModel.set("connectivityMessage", getConnectivityMessage(newConnectionType))
    });


    return viewModel;
}

exports.createViewModel = createViewModel;
