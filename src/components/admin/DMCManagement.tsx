import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const DMCManagement: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>DMC Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="dmc-file" className="block text-sm font-medium text-gray-700">
              Upload DMC File
            </label>
            <div className="mt-1 flex items-center">
              <Input id="dmc-file" type="file" />
              <Button className="ml-4">Upload</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DMCManagement;