export function requestPermission() {
    Notification.requestPermission().then(function (result) {
        if (result === 'granted') {
            makeNotification("通知設定完了", "SnapAppの通知が届くようになります!", "icon-512x512.png");
        }
    })
}

export function makeNotification(notifyTitle, notifyBody, notifyImg) {
    const options = {
        body: notifyBody,
        icon: notifyImg
    }
    new Notification(notifyTitle, options);
}
