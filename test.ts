// Тестов файл (pxt.json → testFiles) — не влиза в проектите на потребителите.
// Служи само да докаже, че блоковете се компилират и се ползват смислено.

uchitel.onButtonPressed(DigitalPin.P1, function () {
    uchitel.setLed(uchitel.OnOff.On, DigitalPin.P2)
    basic.pause(500)
    uchitel.setLed(uchitel.OnOff.Off, DigitalPin.P2)
})

basic.forever(function () {
    basic.showNumber(uchitel.dht11(DigitalPin.P0, uchitel.DHT11Reading.Temperature))
    basic.pause(2000)
    if (uchitel.tilt(DigitalPin.P3) || uchitel.buttonPressed(DigitalPin.P1)) {
        uchitel.setRelay(uchitel.OnOff.On, DigitalPin.P4)
    } else {
        uchitel.setRelay(uchitel.OnOff.Off, DigitalPin.P4)
    }
})
