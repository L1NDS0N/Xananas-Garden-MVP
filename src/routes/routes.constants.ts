interface IAppRoutes {
    base: IBase;
    resources?: IResources;
}

interface IBase {
    url: string;
    port: string;
    path: string;
}

interface IResources {
    [key: string]: IResource;
}

interface IResource {
    methods?: string[];
    public?: boolean;
    [key: string]: any;
}

const APP_ROUTES: IAppRoutes = {
    base: {
        url: '',
        port: '',
        path: '/api/v1'
    },
    resources: {
        admin: {
            auth: {
                methods: ['ALL']
            }
        },
        catalog: {
            methods: ['ALL'],
            public: true,
            another: {
                teste: {}
            }
        }
    }
};

export function useRouter() {
    function $b(): typeof APP_ROUTES.base {
        return APP_ROUTES['base']!
 }
 function $r(): typeof APP_ROUTES.resources{
        return APP_ROUTES['resources']!;
    }
    return {
        $r,
        $b
    }         
}