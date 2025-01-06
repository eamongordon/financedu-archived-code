import { lightbox } from 'wix-window';

const combineDateTime = (date, time) => {
    const combined = new Date(date.toISOString().split('T')[0] + 'T' + time);
    return combined;
}

export function datePickerStart_change(event) {
    const startDate = combineDateTime($w('#datePickerStart').value, $w('#timePickerStart').value);
    const endDate = combineDateTime($w('#datePickerEnd').value, $w('#timePickerEnd').value);
    if (startDate.getTime() > endDate.getTime()) {
        $w('#datePickerEnd').value = new Date();
        const hoursValue = (new Date()).getHours() > 9 ? (new Date()).getHours().toString() : '0' + (new Date()).getHours().toString();
        const minutesValue = (new Date()).getMinutes() > 9 ? (new Date()).getMinutes().toString() : '0' + (new Date()).getMinutes().toString();
        $w('#timePickerEnd').value = `${hoursValue}:${minutesValue}`;
    }
}

export function timePickerStart_change(event) {
    const startDate = combineDateTime($w('#datePickerStart').value, $w('#timePickerStart').value);
    const endDate = combineDateTime($w('#datePickerEnd').value, $w('#timePickerEnd').value);
    if (startDate.getTime() > endDate.getTime()) {
        $w('#datePickerEnd').value = new Date();
        const hoursValue = (new Date()).getHours() > 9 ? (new Date()).getHours().toString() : '0' + (new Date()).getHours().toString();
        const minutesValue = (new Date()).getMinutes() > 9 ? (new Date()).getMinutes().toString() : '0' + (new Date()).getMinutes().toString();
        $w('#timePickerEnd').value = `${hoursValue}:${minutesValue}`;
    }
}

export function datePickerEnd_change(event) {
    const startDate = combineDateTime($w('#datePickerStart').value, $w('#timePickerStart').value);
    const endDate = combineDateTime($w('#datePickerEnd').value, $w('#timePickerEnd').value);
    if (startDate.getTime() > endDate.getTime()) {
        $w('#datePickerStart').value = endDate;
        $w('#timePickerStart').value = '00:00';
    }
}

export function timePickerEnd_change(event) {
    const startDate = combineDateTime($w('#datePickerStart').value, $w('#timePickerStart').value);
    const endDate = combineDateTime($w('#datePickerEnd').value, $w('#timePickerEnd').value);
    if (startDate.getTime() > endDate.getTime()) {
        $w('#datePickerStart').value = endDate;
        $w('#timePickerStart').value = '00:00';
    }
}

export function cancel_click(event) {
    lightbox.close();
}

export function confirm_click(event) {
    const startDate = combineDateTime($w('#datePickerStart').value, $w('#timePickerStart').value);
    const endDate = combineDateTime($w('#datePickerEnd').value, $w('#timePickerEnd').value);
    lightbox.close({startDate: startDate, endDate: endDate});
}