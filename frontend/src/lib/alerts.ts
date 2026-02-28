import Swal from 'sweetalert2';

const commonConfig = {
    background: 'rgba(255, 255, 255, 0.95)',
    color: '#1E293B',
    backdrop: `
        rgba(15, 23, 42, 0.4)
        backdrop-filter: blur(8px)
    `,
    customClass: {
        popup: 'premium-swal-popup',
        title: 'premium-swal-title',
        htmlContainer: 'premium-swal-text',
        confirmButton: 'premium-swal-confirm',
        cancelButton: 'premium-swal-cancel',
        timerProgressBar: 'premium-swal-progress'
    },
    buttonsStyling: false,
    showClass: {
        popup: 'animate__animated animate__fadeInUp animate__faster'
    },
    hideClass: {
        popup: 'animate__animated animate__fadeOutDown animate__faster'
    }
};

export const showSuccess = (message: string) => {
    return Swal.fire({
        ...commonConfig,
        icon: 'success',
        title: 'Success',
        text: message,
        timer: 2500,
        showConfirmButton: false,
        timerProgressBar: true,
        iconColor: '#46C2DE',
    });
};

export const showError = (message: string) => {
    return Swal.fire({
        ...commonConfig,
        icon: 'error',
        title: 'Authentication Error',
        text: message,
        confirmButtonText: 'Try Again',
        iconColor: '#FF7E67',
    });
};

export const showConfirm = (title: string, text: string) => {
    return Swal.fire({
        ...commonConfig,
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        iconColor: '#46C2DE',
    });
};

export const showLoading = (title: string = 'Syncing Records...') => {
    Swal.fire({
        ...commonConfig,
        title: title,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
};
