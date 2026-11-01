import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  it('getUser calls the users endpoint with the id', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);

    TestBed.inject(UsersService).getUser('u1').subscribe();

    expect(http.expectOne({ method: 'GET', url: '/api/users/u1' })).toBeTruthy();
    http.verify();
  });
});
