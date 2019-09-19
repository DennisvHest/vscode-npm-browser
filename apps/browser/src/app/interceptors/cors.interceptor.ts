import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class CorsInterceptor implements HttpInterceptor {

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const newReq = req.clone({
            url: `https://cors-anywhere.herokuapp.com/${req.url}`,
            headers: req.headers.set('X-Requested-With', 'XMLHttpRequest')
        });

        return next.handle(newReq);
    }

}
