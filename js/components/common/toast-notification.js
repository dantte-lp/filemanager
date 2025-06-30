// js/components/common/toast-notification.js

Vue.component('toast-notification', {
    template: '#toast-notification-template',
    props: {
        message: {
            type: String,
            required: true
        },
        type: {
            type: String,
            default: 'success',
            validator: value => ['success', 'error', 'info'].includes(value)
        }
    }
});