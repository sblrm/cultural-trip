
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Users, CalendarDays, Award, Mail, Phone } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Tentang Cultural Trip</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Kami adalah platform yang membantu wisatawan menemukan dan merencanakan
          perjalanan budaya di seluruh Indonesia dengan cara yang mudah dan terpersonalisasi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div>
          <h2 className="text-2xl font-bold mb-4">Misi Kami</h2>
          <p className="text-muted-foreground mb-6">
            Cultural Trip didirikan dengan misi untuk melestarikan dan mempromosikan 
            kekayaan budaya Indonesia melalui teknologi. Kami ingin memudahkan para 
            wisatawan lokal dan mancanegara untuk menjelajahi warisan budaya yang 
            beragam di seluruh nusantara.
          </p>
          <p className="text-muted-foreground">
            Dengan menggunakan teknologi AI dan pemetaan digital, kami menciptakan 
            pengalaman perjalanan yang personal, informatif, dan memudahkan para 
            wisatawan menemukan tempat-tempat budaya yang mungkin belum banyak 
            dikunjungi tetapi memiliki nilai sejarah dan budaya yang tinggi.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Visi Kami</h2>
          <p className="text-muted-foreground mb-6">
            Kami memimpikan Indonesia sebagai destinasi wisata budaya utama di dunia, 
            dengan keanekaragaman budaya yang dihargai dan dilestarikan oleh generasi 
            mendatang.
          </p>
          <p className="text-muted-foreground">
            Cultural Trip berusaha menjadi jembatan digital antara warisan budaya 
            Indonesia dengan teknologi modern, memastikan bahwa kisah-kisah sejarah 
            dan tradisi kita terus hidup dan dapat diakses oleh semua orang, di 
            mana pun mereka berada.
          </p>
        </div>
      </div>

      <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-8 mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Mengapa Memilih Cultural Trip?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-3 w-12 h-12 flex items-center justify-center mb-4">
                <MapPin className="text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Rute Perjalanan Cerdas</h3>
              <p className="text-muted-foreground">
                AI kami membuat rute optimal berdasarkan preferensi dan lokasi Anda, menghemat waktu dan biaya.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-3 w-12 h-12 flex items-center justify-center mb-4">
                <Award className="text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Konten Budaya Berkualitas</h3>
              <p className="text-muted-foreground">
                Informasi akurat dan mendalam tentang setiap destinasi budaya di Indonesia.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-3 w-12 h-12 flex items-center justify-center mb-4">
                <Users className="text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Pengalaman Lokal</h3>
              <p className="text-muted-foreground">
                Temukan tempat-tempat yang dicintai penduduk lokal dan pengalaman otentik.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Tim Kami</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <div className="w-32 h-32 bg-muted/30 dark:bg-muted/20 rounded-full mx-auto mb-4"></div>
              <h3 className="font-bold">Nama Lengkap</h3>
              <p className="text-muted-foreground">Posisi / Jabatan</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-primary/5 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-8">Hubungi Kami</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="flex items-center">
            <div className="mr-4">
              <Mail className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="font-bold">Email</h3>
              <p className="text-gray-600">info@TravoMate.id</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="mr-4">
              <Phone className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="font-bold">Telepon</h3>
              <p className="text-gray-600">+62 21 1234 5678</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="mr-4">
              <MapPin className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="font-bold">Alamat</h3>
              <p className="text-gray-600">Jl. Pasir Kaliki No. 123, Kota Bandung</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Kirim Pesan</h3>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                <input type="text" className="w-full px-4 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full px-4 py-2 border rounded-md" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subjek</label>
              <input type="text" className="w-full px-4 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pesan</label>
              <textarea rows={4} className="w-full px-4 py-2 border rounded-md"></textarea>
            </div>
            <button type="submit" className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
              Kirim Pesan
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
