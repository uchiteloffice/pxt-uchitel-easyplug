// Тестов файл (pxt.json → testFiles) — не влиза в проектите на потребителите.
// Служи само да докаже, че блоковете се компилират и се ползват смислено.

basic.forever(function () {
    basic.showNumber(uchitel.dht11(DigitalPin.P0, uchitel.DHT11Reading.Temperature))
    basic.pause(2000)
    basic.showNumber(uchitel.dht11(DigitalPin.P0, uchitel.DHT11Reading.Humidity))
    basic.pause(2000)
})
