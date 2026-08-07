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

    /**
     * Whether a module is switched on or off.
     */
    export enum OnOff {
        //% block="on"
        On,
        //% block="off"
        Off
    }

    /**
     * Read whether the push button module is currently pressed.
     * @param pin the pin the module is plugged into
     */
    //% blockId=uchitel_button_pressed
    //% block="button at pin %pin is pressed"
    //% weight=90
    export function buttonPressed(pin: DigitalPin): boolean {
        pins.setPull(pin, PinPullMode.PullUp);
        // Модулът дърпа линията към маса при натискане → 0 значи натиснат.
        return pins.digitalReadPin(pin) == 0;
    }

    /**
     * Run code when the push button module is pressed.
     * @param pin the pin the module is plugged into
     */
    //% blockId=uchitel_on_button_pressed
    //% block="on button at pin %pin pressed"
    //% weight=89
    export function onButtonPressed(pin: DigitalPin, handler: () => void): void {
        pins.setPull(pin, PinPullMode.PullUp);
        pins.onPulsed(pin, PulseValue.Low, handler);
    }

    /**
     * Read whether the tilt module is triggered.
     * @param pin the pin the module is plugged into
     */
    //% blockId=uchitel_tilt
    //% block="tilt sensor at pin %pin is triggered"
    //% weight=88
    export function tilt(pin: DigitalPin): boolean {
        pins.setPull(pin, PinPullMode.PullUp);
        return pins.digitalReadPin(pin) == 0;
    }

    /**
     * Switch the relay module on or off.
     * @param state on or off
     * @param pin the pin the module is plugged into
     */
    //% blockId=uchitel_set_relay
    //% block="turn %state the relay at pin %pin"
    //% weight=80
    export function setRelay(state: OnOff, pin: DigitalPin): void {
        pins.digitalWritePin(pin, state == OnOff.On ? 1 : 0);
    }

    /**
     * Switch the LED module on or off.
     * @param state on or off
     * @param pin the pin the module is plugged into
     */
    //% blockId=uchitel_set_led
    //% block="turn %state the LED at pin %pin"
    //% weight=79
    export function setLed(state: OnOff, pin: DigitalPin): void {
        pins.digitalWritePin(pin, state == OnOff.On ? 1 : 0);
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
