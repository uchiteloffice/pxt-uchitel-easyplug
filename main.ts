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

// ⚠ Цветът е сверен с ЦЯЛАТА палитра на micro:bit, а не избран на око. Първият
//   опит беше #00a3a3 — на практика същият като Logic (#00A4A6), тоест нашите
//   блокове изглеждаха като вградените „ако/тогава", които са в почти всяка
//   програма. Заети са: Basic #1E90FF · Input #D400D4 · Music #E63022 ·
//   Led #5C2D91 · Pins #B22222 · Serial #002050 · Game #007A4B · Logic #00A4A6 ·
//   Loops #00AA00 · Math #9400D3 · Variables #DC143C · Text #B8860B ·
//   Arrays #E65722 (и PlanetX е оранжев). Кафявото не се дублира с нищо.
//% color=#795548 icon="" block="Uchitel"
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

    // ───────────────── LCD 1602 през I2C ─────────────────
    // Адресът е 0x27 — потвърден в документацията на Keyestudio за EASY plug
    // 1602 (`LiquidCrystal_I2C lcd(0x27,16,2)`). Някои екземпляри са 0x3F,
    // затова има и блок за смяна, вместо адресът да е зазидан.
    let lcdAddr = 0x27;
    let lcdReady = false;

    function lcdSend(data: number): void {
        // PCF8574: бит 3 = подсветка, бит 2 = EN. Данните се пращат по 4 бита.
        pins.i2cWriteNumber(lcdAddr, data | 0x08, NumberFormat.Int8LE);
        pins.i2cWriteNumber(lcdAddr, data | 0x0c, NumberFormat.Int8LE);
        control.waitMicros(1);
        pins.i2cWriteNumber(lcdAddr, data | 0x08, NumberFormat.Int8LE);
        control.waitMicros(50);
    }

    function lcdCmd(cmd: number): void {
        lcdSend(cmd & 0xf0);
        lcdSend((cmd << 4) & 0xf0);
    }

    function lcdData(chr: number): void {
        lcdSend((chr & 0xf0) | 0x01);
        lcdSend(((chr << 4) & 0xf0) | 0x01);
    }

    function lcdEnsure(): void {
        if (lcdReady) return;
        lcdCmd(0x33); lcdCmd(0x32);   // въвеждане в 4-битов режим
        lcdCmd(0x28);                 // 2 реда, шрифт 5×8
        lcdCmd(0x0c);                 // екранът свети, без курсор
        lcdCmd(0x06);                 // курсорът върви надясно
        lcdCmd(0x01);                 // изчистване
        basic.pause(2);
        lcdReady = true;
    }

    /**
     * Show a line of text on the LCD screen.
     * @param text the text to show
     * @param line which row, 1 or 2
     */
    //% blockId=uchitel_lcd_text
    //% block="LCD show text %text on line %line"
    //% line.min=1 line.max=2 line.defl=1
    //% weight=70
    export function lcdShowText(text: string, line: number): void {
        lcdEnsure();
        lcdCmd(line <= 1 ? 0x80 : 0xc0);
        // 16 знака на ред; по-дългият текст се отрязва, вместо да прелива.
        for (let i = 0; i < 16; i++) {
            lcdData(i < text.length ? text.charCodeAt(i) : 32);
        }
    }

    /**
     * Show a number on the LCD screen.
     * @param value the number to show
     * @param line which row, 1 or 2
     */
    //% blockId=uchitel_lcd_number
    //% block="LCD show number %value on line %line"
    //% line.min=1 line.max=2 line.defl=1
    //% weight=69
    export function lcdShowNumber(value: number, line: number): void {
        lcdShowText("" + value, line);
    }

    /**
     * Clear the LCD screen.
     */
    //% blockId=uchitel_lcd_clear
    //% block="LCD clear"
    //% weight=68
    export function lcdClear(): void {
        lcdEnsure();
        lcdCmd(0x01);
        basic.pause(2);
    }

    /**
     * The I2C address printed on the LCD backpack.
     */
    // ⚠ Меню, а НЕ свободно число: документацията на модула казва „0x27", а
    //   полето за число в MakeCode приема само десетично. Учител, който препише
    //   0x27, щеше да получи друг адрес и мълчаливо мъртъв екран. Двете
    //   означения стоят едно до друго в етикета.
    export enum LcdAddress {
        //% block="0x27 (39)"
        A27 = 39,
        //% block="0x3F (63)"
        A3F = 63
    }

    /**
     * Change the I2C address of the LCD screen. Most modules are 0x27.
     * @param address the I2C address printed on the module
     */
    //% blockId=uchitel_lcd_address
    //% block="LCD use I2C address %address"
    //% advanced=true weight=10
    export function lcdSetAddress(address: LcdAddress): void {
        lcdAddr = address;
        lcdReady = false;
    }

    // ───────────────── 4-цифров дисплей (TM1637) ─────────────────
    // Чипът е TM1637 — потвърден в документацията на Keyestudio (KS0369),
    // управлява се с два извода: CLK и DIO.
    const CIFRI = [0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f];

    function tmStart(clk: DigitalPin, dio: DigitalPin): void {
        pins.digitalWritePin(clk, 1); pins.digitalWritePin(dio, 1);
        pins.digitalWritePin(dio, 0); pins.digitalWritePin(clk, 0);
    }

    function tmStop(clk: DigitalPin, dio: DigitalPin): void {
        pins.digitalWritePin(clk, 0); pins.digitalWritePin(dio, 0);
        pins.digitalWritePin(clk, 1); pins.digitalWritePin(dio, 1);
    }

    function tmWrite(clk: DigitalPin, dio: DigitalPin, bayt: number): void {
        for (let i = 0; i < 8; i++) {
            pins.digitalWritePin(clk, 0);
            pins.digitalWritePin(dio, (bayt >> i) & 1);
            pins.digitalWritePin(clk, 1);
        }
        // деветият такт е потвърждението от чипа
        pins.digitalWritePin(clk, 0);
        pins.digitalWritePin(dio, 1);
        pins.digitalWritePin(clk, 1);
    }

    /**
     * Show a number on the 4-digit display.
     * @param value the number to show, 0 to 9999
     * @param clk the CLK pin
     * @param dio the DIO pin
     */
    //% blockId=uchitel_tm1637_number
    //% block="4-digit display at CLK %clk DIO %dio show %value"
    //% weight=60
    export function displayShowNumber(clk: DigitalPin, dio: DigitalPin, value: number): void {
        let n = Math.abs(Math.trunc(value)) % 10000;
        tmStart(clk, dio); tmWrite(clk, dio, 0x40); tmStop(clk, dio);   // автоадресиране
        tmStart(clk, dio); tmWrite(clk, dio, 0xc0);                     // от първата цифра
        for (let poz = 3; poz >= 0; poz--) {
            tmWrite(clk, dio, CIFRI[Math.idiv(n, Math.pow(10, poz)) % 10]);
        }
        tmStop(clk, dio);
        tmStart(clk, dio); tmWrite(clk, dio, 0x8f); tmStop(clk, dio);   // светене, макс. яркост
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
