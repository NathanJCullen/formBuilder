class Field {
    constructor(fieldDef, fieldMap) {
        this.fieldDef = fieldDef;
        this.fieldMap = fieldMap;
        this.element = this.createElement();
        this.registerDisplayRule();
    }

    createElement() {
        throw new Error("createElement() not implemented");
    }

    onChange(callback) {
        this._onChange = callback;
    }

    triggerChange(value) {
        this.fieldDef.fieldValue = value;
        if (this._onChange) this._onChange(value);
    }

    getValue() {
        return this.fieldDef.fieldValue;
    }

    setValue(value) {
        this.fieldDef.fieldValue = value;
    }

    registerDisplayRule() {
        // Initial display handled later
    }
}

class StringField extends Field {
    createElement() {
        const input = document.createElement("input");
        input.type = "text";
        input.value = this.fieldDef.fieldValue || "";

        input.addEventListener("input", () => this.triggerChange(input.value));

        input.getValue = () => input.value;
        input.setValue = val => { input.value = val; this.triggerChange(val); };

        return input;
    }
}

class DateField extends Field {
    createElement() {
        const input = document.createElement("input");
        input.type = "date";
        input.value = this.fieldDef.fieldValue || "";

        input.addEventListener("change", () => this.triggerChange(input.value));

        input.getValue = () => input.value;
        input.setValue = val => { input.value = val; this.triggerChange(val); };

        return input;
    }
}

class SingleSelectField extends Field {
    createElement() {
        const select = document.createElement("select");
        this.fieldDef.options.forEach(opt => {
            const option = document.createElement("option");
            option.value = opt.value;
            option.textContent = opt.label;
            select.appendChild(option);
        });

        select.value = this.fieldDef.fieldValue || "";
        select.addEventListener("change", () => this.triggerChange(select.value));

        select.getValue = () => select.value;
        select.setValue = val => { select.value = val; this.triggerChange(val); };

        return select;
    }
}

class MultiSelectField extends Field {
    createElement() {
        const wrapper = document.createElement("div");
        wrapper.classList.add("multi-wrapper");

        const display = document.createElement("div");
        display.classList.add("multi-display");
        display.textContent = "Select options";

        const dropdown = document.createElement("div");
        dropdown.classList.add("multi-dropdown");

        const realSelect = document.createElement("select");
        realSelect.multiple = true;
        realSelect.style.display = "none";

        const value = this.fieldDef.fieldValue || [];

        this.fieldDef.options.forEach(opt => {
            const option = document.createElement("option");
            option.value = opt.value;
            option.textContent = opt.label;
            option.selected = value.includes(opt.value);
            realSelect.appendChild(option);

            const item = document.createElement("div");
            item.classList.add("multi-item");
            item.textContent = opt.label;
            if (option.selected) item.classList.add("selected");

            item.addEventListener("click", () => {
                option.selected = !option.selected;
                item.classList.toggle("selected");
                const vals = Array.from(realSelect.selectedOptions).map(o => o.value);
                this.triggerChange(vals);
                updateDisplay();
            });

            dropdown.appendChild(item);
        });

        function updateDisplay() {
            const selected = Array.from(realSelect.selectedOptions).map(o => o.textContent);
            display.textContent = selected.length ? selected.join(", ") : "Select options";
        }
        updateDisplay();

        display.addEventListener("click", () => dropdown.classList.toggle("show"));
        document.addEventListener("click", e => {
            if (!wrapper.contains(e.target)) dropdown.classList.remove("show");
        });

        wrapper.appendChild(display);
        wrapper.appendChild(dropdown);
        wrapper.appendChild(realSelect);

        wrapper.getValue = () => Array.from(realSelect.selectedOptions).map(o => o.value);
        wrapper.setValue = vals => {
            Array.from(realSelect.options).forEach(opt => {
                opt.selected = vals.includes(opt.value);
            });
            Array.from(dropdown.children).forEach(item => {
                const val = item.textContent;
                item.classList.toggle("selected", vals.includes(val));
            });
            updateDisplay();
            this.triggerChange(vals);
        };

        return wrapper;
    }
}

class ToggleField extends Field {
    createElement() {
        const wrapper = document.createElement("label");
        wrapper.classList.add("switch");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !!this.fieldDef.fieldValue;

        const slider = document.createElement("span");
        slider.classList.add("slider");

        checkbox.addEventListener("change", () => this.triggerChange(checkbox.checked));

        wrapper.appendChild(checkbox);
        wrapper.appendChild(slider);

        wrapper.getValue = () => checkbox.checked;
        wrapper.setValue = val => { checkbox.checked = val; this.triggerChange(val); };

        return wrapper;
    }
}

function createFieldFactory(fieldDef, fieldMap) {
    switch (fieldDef.type) {
        case "string": return new StringField(fieldDef, fieldMap);
        case "date": return new DateField(fieldDef, fieldMap);
        case "single-select": return new SingleSelectField(fieldDef, fieldMap);
        case "multi-select": return new MultiSelectField(fieldDef, fieldMap);
        case "toggle": return new ToggleField(fieldDef, fieldMap);
        default: throw new Error("Unsupported field type");
    }
}

// ----------------------
// Main rendering logic
// ----------------------

const blades = document.querySelectorAll('.blade');
const fieldMap = new Map();

// ----------------------
// Helpers
// ----------------------

function isFieldVisible(fieldDef, fieldMap) {
    if (!fieldDef.displayRule) return true;

    const parentEntry = fieldMap.get(fieldDef.displayRule.fieldName);
    if (!parentEntry) return true;

    const parentField = parentEntry.field;
    const parentDiv = parentEntry.fieldDiv;

    if (parentDiv.classList.contains('hide')) return false;

    const parentValue = parentField.getValue();
    const ruleValue = fieldDef.displayRule.value;

    if (Array.isArray(ruleValue)) {
        return Array.isArray(parentValue) && ruleValue.every(v => parentValue.includes(v));
    } else {
        return parentValue === ruleValue;
    }
}

function createSection(section, blade) {
    const tab = document.createElement('div');
    tab.classList.add('tab');
    tab.setAttribute('name', section.name);

    const tabHeader = document.createElement('h3');
    tabHeader.classList.add('tab-header');

    const tabBody = document.createElement('div');
    tabBody.classList.add('tab-body');

    tab.appendChild(tabHeader);
    tab.appendChild(tabBody);
    blade.appendChild(tab);
}

function createTabFields(tabData, fieldDef, body) {
    const fieldDiv = document.createElement('div');
    fieldDiv.classList.add('field');

    const fieldNameEl = document.createElement('label');
    fieldNameEl.textContent = fieldDef.fieldName;
    fieldNameEl.classList.add('fieldName');

    const fieldObj = createFieldFactory(fieldDef, fieldMap);

    if (fieldDef.mandatory) {
        fieldNameEl.classList.add('mandatory')
        fieldObj.element.classList.add('mandatory-border')
    }

    fieldObj.onChange(() => {
        // Re-evaluate all fields on any change
        fieldMap.forEach(({ field, fieldDiv }) => {
            if (!fieldDiv) return;
            const visible = isFieldVisible(field.fieldDef, fieldMap);
            fieldDiv.classList.toggle('hide', !visible);
        });
    });

    fieldMap.set(fieldDef.fieldName, { field: fieldObj, fieldDiv });

    // Apply initial visibility
    if (!isFieldVisible(fieldDef, fieldMap)) {
        fieldDiv.classList.add('hide');
    }

    fieldDiv.appendChild(fieldNameEl);
    fieldDiv.appendChild(fieldObj.element);
    body.appendChild(fieldDiv);
}

// ----------------------
// Render blades, sections, and fields
// ----------------------
blades.forEach((blade) => {
    const bladeType = blade.getAttribute('type');
    const bladeData = data.find(d => d.type === bladeType);
    if (!bladeData) return;

    bladeData.sections.forEach(section => createSection(section, blade));

    const tabs = blade.querySelectorAll('.tab');
    tabs.forEach(tab => {
        const header = tab.querySelector('.tab-header');
        const body = tab.querySelector('.tab-body');

        const tabData = bladeData.sections.find(s => s.name === tab.getAttribute('name'));

        if (tab.getAttribute('name') === 'Details') {
            body.classList.add('show');
        }
        header.addEventListener('click', () => {
            body.classList.toggle('show');
        });


        header.textContent = tabData.name;

        tabData.fields.forEach(field => createTabFields(tabData, field, body));
    });

    bladeData.footer.forEach((nav) => {
        const navEl = document.createElement('div');
        navEl.textContent = nav;
        navEl.classList.add('nav');

        navEl.addEventListener(('click'), () => {
            alert(`${nav} Blade`)
        })
        blade.appendChild(navEl);
    })
});