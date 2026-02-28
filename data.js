const data = [{
    type: 'project',
    title: 'Project Blade',
    sections: [
        {
            name: 'Details', fields: [
                { fieldName: 'Project Name', type: 'string', fieldValue: '', mandatory: true },
                { fieldName: 'Date', type: 'date' },
                { fieldName: 'Toggle', type: 'toggle', fieldValue: false },
                { fieldName: 'Operating Company', type: 'single-select', options: [{ label: 'VM02', value: 'VM02' }, { label: 'NexFibre', value: 'NexFibre' }], displayRule: { fieldName: 'Toggle', value: true }, fieldValue: 'NexFibre' },
                { fieldName: 'Multi Select Example', type: 'multi-select', options: [{ label: 'Option 1', value: 'Option 1' }, { label: 'Option 2', value: 'Option 2' }], fieldValue: ['Option 1'], displayRule: { fieldName: 'Operating Company', value: 'VM02' } },
            ]
        },
        {
            name: 'Delays', fields: [
                { fieldName: 'Email Delay', type: 'string', fieldValue: '0', displayRule: { fieldName: 'Multi Select Example', value: ['Option 1', 'Option 2'] } },
                { fieldName: 'Letter Delay', type: 'string', fieldValue: '0' },
                { fieldName: 'SMS Delay', type: 'string', fieldValue: '0' },

            ]
        },
    ],
    footer: ['Participants']
}] 