// js/components/common/loading-spinner.js

Vue.component('loading-spinner', {
    template: `
        <div class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    `
});