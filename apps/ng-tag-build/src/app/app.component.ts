import { Component, OnInit } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Tag Build';
  constructor(private metaService: Meta) {}

  ngOnInit(): void {
    this.addMetaTags();
  }

  addMetaTags(): void {
    this.metaService.addTags([
      {
        name: 'description',
        content:
          'Automate your GTM configuration process effortlessly with our GTM Tag Build, ensuring accurate and optimized JSON file creation. Ideal for digital marketers and SEO experts, our tool streamlines tag management, reducing errors and enhancing productivity by focusing on data analysis over technicalities.',
      },
      {
        name: 'keywords',
        content:
          'GTM, Tag Build, JSON, SEO, Digital Marketing, Web Development, Tag Management, Data Analysis, Productivity, Optimization',
      },
      {
        property: 'og:title',
        content:
          'Effortless GTM Configuration and Management with Our JSON Generator Tool',
      },
      {
        property: 'og:description',
        content:
          'Automate your GTM configuration process effortlessly with our GTM Tag Build, ensuring accurate and optimized JSON file creation. Ideal for digital marketers and SEO experts, our tool streamlines tag management, reducing errors and enhancing productivity by focusing on data analysis over technicalities.',
      },
      {
        property: 'og:url',
        content: 'https://gtm-config-generator.netlify.app/',
      },
      { property: 'og:type', content: 'website' },
      {
        property: 'twitter:title',
        content:
          'Effortless GTM Configuration and Management with Our JSON Building Tool',
      },
      {
        property: 'twitter:description',
        content:
          'Automate your GTM configuration process effortlessly with our GTM Tag Build, ensuring accurate and optimized JSON file creation. Ideal for digital marketers and SEO experts, our tool streamlines tag management, reducing errors and enhancing productivity by focusing on data analysis over technicalities.',
      },
    ]);
  }
}
