// js/components/common/empty-state.js

Vue.component('empty-state', {
    props: {
        message: {
            type: String,
            default: 'Нет данных'
        },
        icon: {
            type: String,
            default: 'fas fa-folder-open'
        }
    },
    template: `
        <div class="text-center py-12 text-gray-500">
            <i :class="icon" class="text-6xl mb-4"></i>
            <p>{{ message }}</p>
        </div>
    `
});