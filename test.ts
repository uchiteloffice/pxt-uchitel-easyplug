// Тестов файл (pxt.json → testFiles) — не влиза в проектите на потребителите.
// Служи само да докаже, че блоковете се компилират и се ползват смислено.

uchitel.onButtonPressed(DigitalPin.P1, function () {
    uchitel.setLed(uchitel.OnOff.On, DigitalPin.P2)
    basic.pause(500)
    uchitel.setLed(uchitel.OnOff.Off, DigitalPin.P2)
})

uchitel.lcdSetAddress(uchitel.LcdAddress.A27)
uchitel.lcdClear()

basic.forever(function () {
    let t = uchitel.dht11(DigitalPin.P0, uchitel.DHT11Reading.Temperature)
    uchitel.lcdShowText("Температура:", 1)
    uchitel.lcdShowNumber(t, 2)
    uchitel.displayShowNumber(DigitalPin.P5, DigitalPin.P6, t)
    if (uchitel.tilt(DigitalPin.P3) || uchitel.buttonPressed(DigitalPin.P1)) {
        uchitel.setRelay(uchitel.OnOff.On, DigitalPin.P4)
    } else {
        uchitel.setRelay(uchitel.OnOff.Off, DigitalPin.P4)
    }
    basic.pause(2000)
})
