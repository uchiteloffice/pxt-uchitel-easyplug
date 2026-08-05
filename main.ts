/**
 * Блокове за комплекта Keyestudio EASY Plug (KS4020) — uchitel.bg
 *
 * ⛔ ПРАВИЛОТО: блок показва мерна единица САМО ако чипът наистина я дава.
 *    DHT11 връща калибрирани °C и % от самия сензор — затова тук единиците са честни.
 *    Резистивните сензори (звук, светлина, вода, почва) ще получат относителна
 *    скала 0–100, докато няма измерване срещу еталон.
 *
 * ⚠ Реализацията на протокола е НЕПРОВЕРЕНА срещу хардуер — пратката е в транзит
 *   (PI keyes-AT20260706). До проверката този пакет не се дава на клиенти.
 *
 * ⚠ Текстовете тук са на АНГЛИЙСКИ нарочно: pxt взима source-string-а за език по
 *   подразбиране, а `_locales/<език>/` са наслагвания. Българският живее в
 *   `_locales/bg/` и се пише в същия комит като блока (никога „превод накрая").
 */

//% color=#00a3a3 icon="" block="Uchitel"
namespace uchitel {

    /**
     * Which reading to take from the DHT11 sensor.
     */
    export enum DHT11Reading {
        //% block="temperature (°C)"
        Temperature,
        //% block="humidity (%)"
        Humidity
    }

    // Колко празни обиколки чакаме, преди да приемем, че сензор няма.
    const TIMEOUT = 20000;

    /**
     * Read the temperature or the humidity from a DHT11 sensor.
     * @param pin the pin the sensor is plugged into
     * @param reading what to read
     */
    //% blockId=uchitel_dht11
    //% block="DHT11 at pin %pin reads %reading"
    //% weight=100
    export function dht11(pin: DigitalPin, reading: DHT11Reading): number {
        let raw = 0;

        // Стартов сигнал: дърпаме линията надолу за 18 ms, после я пускаме.
        pins.digitalWritePin(pin, 0);
        basic.pause(18);
        pins.setPull(pin, PinPullMode.PullUp);
        pins.digitalReadPin(pin);
        control.waitMicros(40);

        // Сензорът отговаря с ниско, после високо ниво.
        if (!awaitLevelChange(pin, 0)) return -999;
        if (!awaitLevelChange(pin, 1)) return -999;

        // 32-та бита с данни: дължината на високото ниво кодира 0 или 1.
        for (let i = 0; i < 32; i++) {
            if (!awaitLevelChange(pin, 0)) return -999;
            let ticks = 0;
            while (pins.digitalReadPin(pin) == 1) {
                ticks += 1;
                if (ticks > TIMEOUT) return -999;
            }
            if (ticks > 4) raw = raw + (1 << (31 - i));
        }

        if (reading == DHT11Reading.Temperature) return (raw >> 8) & 0x00ff;
        return (raw >> 24) & 0x00ff;
    }

    // Чака линията да смени нивото; false = сензорът не отговаря.
    function awaitLevelChange(pin: DigitalPin, level: number): boolean {
        let ticks = 0;
        while (pins.digitalReadPin(pin) == level) {
            ticks += 1;
            if (ticks > TIMEOUT) return false;
        }
        return true;
    }
}
