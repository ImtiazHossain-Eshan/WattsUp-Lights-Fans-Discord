# Hardware Schematic — One-Room Sensing Circuit (Wokwi / Tinkercad style)

The PDF asks how the devices *would* be wired and sensed in real life. No real hardware
is required, and wiring all 15 devices adds nothing conceptually — so this is a
**representative circuit for one room** (2 fans + 3 lights). The same block repeats per
room in a real deployment.

## 1. Concept

An **ESP32** sits in each room. Each wall switch is read as a **digital input**
(`INPUT_PULLUP`, switch closes to GND). Each device is *represented* by an **LED
indicator** driven by a GPIO output — in simulation the LED stands in for the
light/fan itself. The ESP32 reports every state change to the backend over Wi-Fi
(HTTP POST), which is exactly the role `simulator.js` plays in this software-only
hackathon build.

## 2. Component list

| Qty | Component | Purpose |
|-----|-----------|---------|
| 1 | ESP32 DevKit v1 (or Arduino Uno + Wi-Fi module) | reads switches, reports state |
| 5 | Momentary/slide switches | stand-ins for the 5 wall switches |
| 5 | LEDs (2 blue = fans, 3 yellow = lights) | device indicators |
| 5 | 220 Ω resistors | LED current limiting |
| 1 | ACS712-05B current sensor *(optional)* | real current measurement concept |
| 2 | 10 kΩ + 20 kΩ resistors *(optional)* | divider: ACS712 5 V out → 3.3 V-safe ADC |
| — | Breadboard + jumper wires | wiring |

## 3. Pin mapping

| Device | Switch input (INPUT_PULLUP) | Indicator output |
|--------|-----------------------------|------------------|
| Fan 1 | GPIO 13 | GPIO 25 |
| Fan 2 | GPIO 12 | GPIO 26 |
| Light 1 | GPIO 14 | GPIO 27 |
| Light 2 | GPIO 18 | GPIO 32 |
| Light 3 | GPIO 19 | GPIO 33 |
| ACS712 OUT *(optional)* | GPIO 34 (input-only, ADC1) | — |

## 4. Connection list (build this exactly in Wokwi)

```
ESP32 GPIO13 ──── switch S1 ──── GND        (Fan 1 state)
ESP32 GPIO12 ──── switch S2 ──── GND        (Fan 2 state)
ESP32 GPIO14 ──── switch S3 ──── GND        (Light 1 state)
ESP32 GPIO18 ──── switch S4 ──── GND        (Light 2 state)
ESP32 GPIO19 ──── switch S5 ──── GND        (Light 3 state)

ESP32 GPIO25 ── 220Ω ── LED1(blue)   ── GND (Fan 1 indicator)
ESP32 GPIO26 ── 220Ω ── LED2(blue)   ── GND (Fan 2 indicator)
ESP32 GPIO27 ── 220Ω ── LED3(yellow) ── GND (Light 1 indicator)
ESP32 GPIO32 ── 220Ω ── LED4(yellow) ── GND (Light 2 indicator)
ESP32 GPIO33 ── 220Ω ── LED5(yellow) ── GND (Light 3 indicator)

Optional current sensing:
ACS712 VCC ── 5V (VIN)      ACS712 GND ── GND
ACS712 OUT ── [20kΩ]──┬──── ESP32 GPIO34
                      └[10kΩ]── GND      (divider ≈ x0.66: 5 V → 3.3 V-safe)
```

Wokwi part names: `wokwi-esp32-devkit-v1`, `wokwi-slide-switch` (or
`wokwi-pushbutton`), `wokwi-led`, `wokwi-resistor`.

## 5. Illustrative firmware sketch

```cpp
const int SWITCH_PINS[5] = {13, 12, 14, 18, 19};
const int LED_PINS[5]    = {25, 26, 27, 32, 33};
bool lastState[5];

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < 5; i++) {
    pinMode(SWITCH_PINS[i], INPUT_PULLUP);   // closed switch = LOW = device ON
    pinMode(LED_PINS[i], OUTPUT);
    lastState[i] = false;
  }
}

void loop() {
  for (int i = 0; i < 5; i++) {
    bool on = digitalRead(SWITCH_PINS[i]) == LOW;
    digitalWrite(LED_PINS[i], on ? HIGH : LOW);
    if (on != lastState[i]) {
      lastState[i] = on;
      Serial.printf("device %d -> %s\n", i, on ? "ON" : "OFF");
      // real build: HTTP POST { deviceId, status } to the backend here
    }
  }
  delay(50); // simple debounce
}
```

## 6. Electrical reasoning & safety notes (important)

- The ESP32 reads switch states as plain **digital inputs** with internal pull-ups —
  no external components needed for sensing.
- LEDs (or a small 5 V motor **through a driver transistor**) merely *represent* the
  devices in the simulation.
- An ESP32/Arduino **must never power or switch mains AC lights and fans directly** —
  GPIOs are 3.3 V / ~40 mA; a ceiling fan is 220 V AC.
- A real installation would add, per device: a **relay module** (or contactor) rated
  for the load, **opto-isolation** between the logic and switching side, a
  **current sensor** (ACS712 / SCT-013 clamp), **fuses/MCB protection**, proper
  enclosures and earthing — and it must be installed by a qualified electrician.
- ACS712 runs on 5 V and can output up to 5 V; ESP32 ADC pins are 3.3 V max, hence the
  voltage divider. GPIO 34 is input-only and on ADC1 (safe to use alongside Wi-Fi).
- **For this hackathon, power draw is simulated in software** (60 W per fan, 15 W per
  light) — the circuit shows how the same state would be *sensed* for real.

## 7. How it maps to the software build

| Real world | This project |
|------------|--------------|
| Wall switch flip | `simulator.js` toggling a device every 5 s |
| ESP32 HTTP POST to backend | direct in-process mutation of the device store |
| ACS712 current reading | `wattage` constants (fan 60 W, light 15 W) |
