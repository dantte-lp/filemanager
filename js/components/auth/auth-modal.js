// js/components/auth/auth-modal.js

Vue.component('auth-modal', {
    template: '#auth-modal-template',
    props: {
        error: {
            type: String,
            default: ''
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            credentials: {
                username: '',
                password: ''
            }
        };
    },
    methods: {
        submitLogin() {
            if (!this.credentials.username || !this.credentials.password) {
                return;
            }
            
            this.$emit('login', {
                username: this.credentials.username,
                password: this.credentials.password
            });
        }
    },
    mounted() {
        // Фокус на поле username при открытии
        this.$nextTick(() => {
            if (this.$refs.usernameInput) {
                this.$refs.usernameInput.focus();
            }
        });
    }
});