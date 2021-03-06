import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class CorsInterceptor implements HttpInterceptor {

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const newReq = req.clone({
            url: `https://pacific-inlet-05434.herokuapp.com/${req.url}`,
            headers: req.headers.set('X-Requested-With', 'XMLHttpRequest')
        });

        return next.handle(newReq).pipe(
            catchError((error) => {
                if (error.status !== 404) {
                    const fallbackReq = newReq.clone({
                        url: `https://cors-anywhere.herokuapp.com/${req.url}`
                    });
    
                    return next.handle(fallbackReq);
                } else {
                    return throwError(error);
                }
            })
        );
    }

}
